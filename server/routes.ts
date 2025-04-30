import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { handleImportContacts } from "./controllers/contact-controller";
import { handleSendMessage, getRecentMessages, getAllMessages } from "./controllers/message-controller";
import { getDashboardStats } from "./controllers/dashboard-controller";
import { getUpcomingSchedules, getAllSchedules } from "./controllers/schedule-controller";
import { whatsappClient } from "./whatsapp";
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
