import { Request, Response } from 'express';
import { storage } from '../storage';
import { whatsappClient } from '../whatsapp';
import { scheduleMessage } from '../services/message-scheduler';
import { z } from 'zod';

// Esquema para enviar mensagem para contatos ou grupos existentes
const sendMessageSchema = z.object({
  recipients: z.array(z.string()),
  subject: z.string().optional(),
  message: z.string(),
  scheduled: z.boolean().default(false),
  scheduledDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
});

// Esquema para enviar mensagem diretamente para números de telefone
const sendDirectMessageSchema = z.object({
  to: z.string(),
  message: z.string(),
  subject: z.string().optional(),
});

export async function handleSendMessage(req: Request, res: Response) {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: parsed.error.flatten() 
      });
    }

    const { recipients, subject, message, scheduled, scheduledDate, scheduledTime } = parsed.data;
    const userId = req.user!.id;

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients specified' });
    }

    // Create message record
    const messageRecord = await storage.createMessage({
      userId,
      subject,
      content: message,
      isScheduled: scheduled,
      scheduledAt: scheduled && scheduledDate && scheduledTime 
        ? new Date(`${scheduledDate}T${scheduledTime}`) 
        : undefined,
      status: scheduled ? 'scheduled' : 'pending',
    });

    // Get contact information for recipients (assuming recipients are contact names)
    const contacts = await storage.getContacts(userId);
    const recipientContacts = contacts.filter(contact => 
      recipients.includes(contact.name) || recipients.includes(contact.phone)
    );

    // If we don't have all contacts, return an error
    if (recipientContacts.length !== recipients.length) {
      return res.status(400).json({ 
        message: 'One or more recipients are not in your contacts' 
      });
    }

    // Add message recipients
    const messageRecipients = recipientContacts.map(contact => ({
      messageId: messageRecord.id,
      contactId: contact.id,
      status: 'pending'
    }));

    await storage.addMessageRecipients(messageRecipients);

    // If it's scheduled, schedule the message
    if (scheduled && scheduledDate && scheduledTime) {
      scheduleMessage({
        id: String(messageRecord.id),
        userId,
        recipients: recipientContacts.map(contact => contact.phone),
        content: message,
        subject
      }, new Date(`${scheduledDate}T${scheduledTime}`));

      return res.status(200).json({
        message: 'Message scheduled successfully',
        scheduled: true,
        messageId: messageRecord.id
      });
    } 
    // Otherwise send it immediately
    else {
      try {
        // Check if WhatsApp client is ready
        const status = whatsappClient.getStatus();
        if (!status.isAuthenticated) {
          return res.status(503).json({ 
            message: 'WhatsApp client is not authenticated' 
          });
        }

        // Send message to all recipients
        const result = await whatsappClient.sendBulkMessages({
          id: String(messageRecord.id),
          userId,
          recipients: recipientContacts.map(contact => contact.phone),
          content: message,
          subject
        });

        // Update message status
        const updatedMessage = {
          ...messageRecord,
          status: result.failed.length === 0 ? 'sent' : 'partial',
          sentAt: new Date()
        };
        
        // In a real application, we would update the message status in the database
        // For this demo, we'll just return the result

        return res.status(200).json({
          message: 'Message sent successfully',
          successful: result.successful.length,
          failed: result.failed.length,
          messageId: messageRecord.id
        });
      } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
          message: 'Failed to send message',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('Error processing message request:', error);
    return res.status(500).json({
      message: 'Failed to process message request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getRecentMessages(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 4;
    
    const messages = await storage.getRecentMessages(userId, limit);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({
      message: 'Failed to fetch recent messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getAllMessages(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const search = req.query.search as string;
    const filter = req.query.filter as string;
    
    const messages = await storage.getMessages(userId, { search, status: filter });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      message: 'Failed to fetch messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Novo endpoint para enviar mensagens diretamente para números de telefone
export async function handleSendDirectMessage(req: Request, res: Response) {
  try {
    const parsed = sendDirectMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: parsed.error.flatten() 
      });
    }

    const { to, message, subject } = parsed.data;
    const userId = req.user!.id;

    // Preparar números de telefone (separados por vírgula, ponto-e-vírgula ou nova linha)
    const phoneNumbers = to
      .split(/[,;\n]/)
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .map(num => {
        // Formatação básica
        if (num.startsWith("+")) {
          return num.replace(/[^\d+]/g, "");
        }
        
        // Remove caracteres não numéricos e adiciona prefixo BR se necessário
        let cleaned = num.replace(/[^\d]/g, "");
        
        // Se o número tiver 10-11 dígitos sem o DDD internacional, adiciona +55
        if (cleaned.length >= 10 && cleaned.length <= 11) {
          return "+55" + cleaned;
        }
        
        return cleaned;
      });

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ message: 'No valid phone numbers specified' });
    }

    // Verificar se o cliente WhatsApp está pronto
    const status = whatsappClient.getStatus();
    if (!status.isAuthenticated) {
      return res.status(503).json({ 
        message: 'WhatsApp client is not authenticated' 
      });
    }

    // Enviar mensagem diretamente (criando e armazenando registros)
    const newMessage = await storage.sendDirectMessage(userId, phoneNumbers, message, subject);

    // Enviar mensagens via WhatsApp
    try {
      // Enviar cada mensagem individualmente
      let successCount = 0;
      let failureCount = 0;

      for (const phone of phoneNumbers) {
        try {
          const result = await whatsappClient.sendMessage(phone, message);
          if (result) {
            successCount++;
          } else {
            failureCount++;
          }
          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Failed to send to ${phone}:`, err);
          failureCount++;
        }
      }

      return res.status(200).json({
        message: 'Messages sent directly',
        successful: successCount,
        failed: failureCount,
        messageId: newMessage.id,
        phoneNumbers
      });
    } catch (error) {
      console.error('Error sending direct messages:', error);
      return res.status(500).json({
        message: 'Error sending direct messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error processing direct message request:', error);
    return res.status(500).json({
      message: 'Failed to process direct message request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
