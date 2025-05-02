import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { handleImportContacts } from "./controllers/contact-controller";
import { handleSendMessage, handleSendDirectMessage, getRecentMessages, getAllMessages } from "./controllers/message-controller";
import { getDashboardStats } from "./controllers/dashboard-controller";
import { getUpcomingSchedules, getAllSchedules } from "./controllers/schedule-controller";
import { whatsappClient } from "./whatsapp";
import { scheduleMessage } from "./services/message-scheduler";
import multer from "multer";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Healthcheck endpoint for Railway
  app.get("/health", (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Set up authentication routes
  setupAuth(app);

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // Dashboard API routes
  app.get("/api/dashboard/stats", isAuthenticated, getDashboardStats);

  // Contacts API routes
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string || "";
      const userId = req.user!.id;
      const contacts = await storage.getContacts(userId, search);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts/import", isAuthenticated, upload.single('file'), handleImportContacts);

  app.delete("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        ids: z.array(z.string())
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      const { ids } = parsed.data;
      const userId = req.user!.id;
      
      await storage.deleteContacts(userId, ids);
      res.status(200).json({ message: "Contacts deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contacts" });
    }
  });

  // Messages API routes
  app.post("/api/messages/send", isAuthenticated, handleSendMessage);
  
  // Endpoint para enviar mensagens diretamente para números de telefone
  app.post("/api/whatsapp/send", isAuthenticated, handleSendDirectMessage);
  
  app.get("/api/messages/recent", isAuthenticated, getRecentMessages);
  
  app.get("/api/messages", isAuthenticated, getAllMessages);

  // Schedules API routes
  app.get("/api/schedules/upcoming", isAuthenticated, getUpcomingSchedules);
  
  app.get("/api/schedules", isAuthenticated, getAllSchedules);

  // WhatsApp connection status
  app.get("/api/whatsapp/status", isAuthenticated, (req, res) => {
    const status = whatsappClient.getStatus();
    res.json(status);
  });
  
  // WhatsApp QR code endpoint - NEEDS PROTECTION IN PRODUCTION!
  app.get("/api/whatsapp/qrcode", isAuthenticated, (req, res) => {
    const status = whatsappClient.getStatus();
    if (status.qrCode) {
      res.json({ qrCode: status.qrCode });
    } else {
      res.status(404).json({ message: "QR code not available" });
    }
  });
  
  // Obter chats do WhatsApp (conversas individuais e grupos)
  app.get("/api/whatsapp/chats", isAuthenticated, async (req, res) => {
    try {
      const chats = await whatsappClient.getWhatsAppChats();
      res.json(chats);
    } catch (error) {
      console.error("Error fetching WhatsApp chats:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp chats" });
    }
  });
  
  // Obter apenas grupos do WhatsApp
  app.get("/api/whatsapp/groups", isAuthenticated, async (req, res) => {
    try {
      const groups = await whatsappClient.getWhatsAppGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching WhatsApp groups:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp groups" });
    }
  });
  
  // Obter contatos do WhatsApp
  app.get("/api/whatsapp/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts = await whatsappClient.getWhatsAppContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching WhatsApp contacts:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp contacts" });
    }
  });
  
  // Enviar mensagem para grupo
  app.post("/api/whatsapp/send-to-group", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        groupId: z.string(),
        message: z.string()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      const { groupId, message } = parsed.data;
      
      const messageId = await whatsappClient.sendMessageToGroup(groupId, message);
      res.json({ success: true, messageId });
    } catch (error) {
      console.error("Error sending message to WhatsApp group:", error);
      res.status(500).json({ message: "Failed to send message to WhatsApp group" });
    }
  });
  
  // Agendar mensagens para grupos
  app.post("/api/whatsapp/schedule-group-messages", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        groupIds: z.array(z.string()),
        message: z.string(),
        scheduledDate: z.string(),
        scheduledTime: z.string()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      const { groupIds, message, scheduledDate, scheduledTime } = parsed.data;
      const userId = req.user!.id;
      
      if (groupIds.length === 0) {
        return res.status(400).json({ message: "No groups specified" });
      }
      
      // Converter data e hora para um objeto Date
      // Usando fuso horário de São Paulo (UTC-3)
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00-03:00`);
      
      // Verificar se a data é futura
      if (scheduledDateTime <= new Date()) {
        return res.status(400).json({ message: "Scheduled time must be in the future" });
      }
      
      // Criar registro de mensagem agendada
      const messageRecord = await storage.createMessage({
        userId,
        subject: `Mensagem agendada para ${groupIds.length} grupos`,
        content: message,
        isScheduled: true,
        scheduledAt: scheduledDateTime,
        status: 'scheduled'
      });
      
      // Agendar a mensagem para cada grupo
      for (const groupId of groupIds) {
        scheduleMessage({
          id: `${messageRecord.id}_${groupId}`,
          userId,
          recipients: [groupId],
          content: message,
          isGroup: true
        }, scheduledDateTime);
      }
      
      res.status(200).json({ 
        message: 'Group messages scheduled successfully',
        scheduled: true,
        messageId: messageRecord.id,
        scheduledFor: scheduledDateTime
      });
    } catch (error) {
      console.error("Error scheduling messages to WhatsApp groups:", error);
      res.status(500).json({ 
        message: "Failed to schedule messages to WhatsApp groups",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Initialize HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
