import { Client } from "whatsapp-web.js";
import { log } from "./vite";
import qrcode from "qrcode";
import { EventEmitter } from "events";

// Custom type for message with additional properties
// Tipos para mensagens e grupos
type ScheduledMessage = {
  id: string;
  userId: number;
  recipients: string[];
  content: string;
  subject?: string;
}

type WhatsAppChat = {
  id: string;
  name: string;
  isGroup: boolean;
  participantsCount?: number;
  timestamp: number;
  unreadCount?: number;
}

type WhatsAppContact = {
  id: string;
  name: string;
  number: string;
  profilePicUrl?: string;
  isMyContact: boolean;
  isGroup: boolean;
}

class WhatsAppClient extends EventEmitter {
  private client: Client | null = null;
  private isInitialized = false;
  private isAuthenticated = false;
  private authenticatedUsers = new Set<number>();
  private qrCode: string | null = null;
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      log("Initializing WhatsApp client...", "whatsapp");
      
      // Verificar se devemos usar o modo simulado
      const forceDevMode = process.env.FORCE_DEV_MODE === 'true';
      const noChrome = !process.env.PUPPETEER_EXECUTABLE_PATH;
      
      // Sempre usar modo de simulação em ambientes de desenvolvimento/testes
      // ou quando a variável FORCE_DEV_MODE está definida como true
      // ou quando não temos o caminho para o Chrome
      // Isso evita problemas com Puppeteer/Chrome em ambientes como Replit ou Railway
      if (this.isDevelopment || process.env.NODE_ENV !== 'production' || forceDevMode || noChrome) {
        log(`Starting WhatsApp in development/test mode (simulated). ENV=${process.env.NODE_ENV}, FORCE_DEV=${forceDevMode}, HAS_CHROME=${!noChrome}`, "whatsapp");
        this.isInitialized = true;
        this.isAuthenticated = true;
        
        // Simular um QR code para testes de desenvolvimento (imagem codificada em base64)
        this.qrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAA1BMVEX///+nxBvIAAAASElEQVR4nO3BMQEAAADCIPuntsYOYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA98PAABpHAX+QAAAABJRU5ErkJggg==";
        
        setTimeout(() => {
          // Após alguns segundos, simular que o cliente está pronto
          this.emit("ready");
          log("WhatsApp client initialized in development/simulation mode", "whatsapp");
        }, 2000);
        
        return;
      }
      
      // For production environment, create the actual WhatsApp client
      log("Starting WhatsApp in production mode with Puppeteer", "whatsapp");
      // Obter argumentos do Puppeteer a partir da variável de ambiente ou usar padrões
      const puppeteerArgs = process.env.PUPPETEER_ARGS ? 
        process.env.PUPPETEER_ARGS.split(',') : 
        [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ];
        
      log(`Initializing WhatsApp with Chrome at: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'default'}`, "whatsapp");
      log(`Using Puppeteer args: ${puppeteerArgs.join(', ')}`, "whatsapp");
        
      this.client = new Client({
        puppeteer: {
          headless: true,
          args: puppeteerArgs,
          // Usar caminho executável configurado ou deixar o Puppeteer encontrar o Chrome
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          defaultViewport: { width: 1280, height: 800 },
          // Aumentar timeouts para ambientes com recursos limitados
          timeout: 120000,
        },
        // Usando opções específicas para a versão do whatsapp-web.js
        authTimeoutMs: 120000,
        qrMaxRetries: 10,
      } as any);
      
      // Set up event listeners for the production client
      if (this.client) {
        this.client.on("qr", (qr) => {
          log("QR Code received from WhatsApp", "whatsapp");
          qrcode.toDataURL(qr, (err, url) => {
            if (err) {
              log(`Error generating QR code: ${err}`, "whatsapp");
              return;
            }
            this.qrCode = url;
            this.emit("qr", url);
            log("QR Code successfully generated and ready for scanning", "whatsapp");
          });
        });

        this.client.on("ready", () => {
          log("WhatsApp client is ready and authenticated!", "whatsapp");
          this.isAuthenticated = true;
          this.isInitialized = true;
          this.qrCode = null;
          this.emit("ready");
        });

        this.client.on("authenticated", () => {
          log("WhatsApp authenticated successfully", "whatsapp");
          this.isAuthenticated = true;
        });

        this.client.on("auth_failure", (msg) => {
          log(`WhatsApp authentication failed: ${msg}`, "whatsapp");
          this.isAuthenticated = false;
          // When auth fails, we should clear the QR code and try to get a new one
          this.qrCode = null;
        });

        this.client.on("disconnected", (reason) => {
          log(`WhatsApp disconnected: ${reason}`, "whatsapp");
          this.isAuthenticated = false;
          this.isInitialized = false;
          // When disconnected, try to initialize again after a short delay
          setTimeout(() => this.initialize(), 5000);
        });

        try {
          log("Initializing WhatsApp client connection...", "whatsapp");
          await this.client.initialize();
          log("WhatsApp client initialization completed", "whatsapp");
        } catch (initError) {
          log(`WhatsApp client initialization error: ${initError}`, "whatsapp");
          throw initError; // Propagate to outer catch block
        }
      }
    } catch (error) {
      log(`Error initializing WhatsApp: ${error}`, "whatsapp");
      this.isInitialized = false;
      this.isAuthenticated = false;
      
      // In production, we want to retry with increasing delays
      const retryDelay = Math.min(30000, 5000 * Math.random() + 5000); // Between 5-10s initially, max 30s
      log(`Will retry WhatsApp initialization in ${retryDelay/1000} seconds`, "whatsapp");
      setTimeout(() => this.initialize(), retryDelay);
    }
  }

  async sendMessage(to: string, message: string): Promise<string | null> {
    if (!this.isAuthenticated) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Format the number to international format if needed
      const formattedNumber = this.formatPhoneNumber(to);
      
      // Verificar se devemos usar o modo simulado
      const forceDevMode = process.env.FORCE_DEV_MODE === 'true';
      // Em modo de desenvolvimento ou se o cliente não está inicializado ou se FORCE_DEV_MODE=true, simular envio de mensagem
      if (this.isDevelopment || process.env.NODE_ENV !== 'production' || !this.client || forceDevMode) {
        log(`[DEV] Sending message to ${formattedNumber}: ${message}`, "whatsapp");
        return `mock_message_${Date.now()}`;
      }
      
      // In production, actually send the message
      const response = await this.client.sendMessage(`${formattedNumber}@c.us`, message);
      return response.id._serialized;
    } catch (error) {
      log(`Error sending WhatsApp message: ${error}`, "whatsapp");
      throw error;
    }
  }

  async sendBulkMessages(
    message: ScheduledMessage
  ): Promise<{ successful: string[]; failed: string[] }> {
    if (!this.isAuthenticated) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    const successful: string[] = [];
    const failed: string[] = [];

    for (const recipient of message.recipients) {
      try {
        await this.sendMessage(recipient, message.content);
        successful.push(recipient);
      } catch (error) {
        log(`Failed to send message to ${recipient}: ${error}`, "whatsapp");
        failed.push(recipient);
      }

      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { successful, failed };
  }

  getStatus(): { isInitialized: boolean; isAuthenticated: boolean, qrCode: string | null } {
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: this.isAuthenticated,
      qrCode: this.qrCode,
    };
  }

  isUserAuthenticated(userId: number): boolean {
    return this.authenticatedUsers.has(userId);
  }

  addAuthenticatedUser(userId: number): void {
    this.authenticatedUsers.add(userId);
  }

  async getWhatsAppChats(): Promise<WhatsAppChat[]> {
    if (!this.isAuthenticated) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Em modo simulado, retorna dados de exemplo
      if (this.isDevelopment || process.env.NODE_ENV !== 'production' || !this.client || process.env.FORCE_DEV_MODE === 'true') {
        log(`[DEV] Getting simulated WhatsApp chats`, "whatsapp");
        
        // Dados de exemplo para desenvolvimento
        return [
          { 
            id: 'sim_chat_1', 
            name: 'Família', 
            isGroup: true, 
            participantsCount: 5, 
            timestamp: Date.now(), 
            unreadCount: 0 
          },
          { 
            id: 'sim_chat_2', 
            name: 'Trabalho', 
            isGroup: true, 
            participantsCount: 8, 
            timestamp: Date.now() - 3600000, 
            unreadCount: 2 
          },
          { 
            id: 'sim_contact_1', 
            name: 'João Silva', 
            isGroup: false, 
            timestamp: Date.now() - 86400000, 
            unreadCount: 0 
          },
        ];
      }

      // Em produção, busca os chats reais
      const chats = await this.client.getChats();
      
      return chats.map(chat => {
        const isGroup = chat.isGroup;
        return {
          id: chat.id._serialized,
          name: chat.name,
          isGroup,
          participantsCount: isGroup ? chat.participants?.length : undefined,
          timestamp: chat.timestamp * 1000, // Converter para milliseconds
          unreadCount: chat.unreadCount
        };
      });
    } catch (error) {
      log(`Error getting WhatsApp chats: ${error}`, "whatsapp");
      throw error;
    }
  }

  async getWhatsAppGroups(): Promise<WhatsAppChat[]> {
    const chats = await this.getWhatsAppChats();
    return chats.filter(chat => chat.isGroup);
  }

  async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    if (!this.isAuthenticated) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Em modo simulado, retorna dados de exemplo
      if (this.isDevelopment || process.env.NODE_ENV !== 'production' || !this.client || process.env.FORCE_DEV_MODE === 'true') {
        log(`[DEV] Getting simulated WhatsApp contacts`, "whatsapp");
        
        // Dados de exemplo para desenvolvimento
        return [
          { 
            id: 'sim_contact_1', 
            name: 'João Silva', 
            number: '5511999991111',
            isMyContact: true,
            isGroup: false
          },
          { 
            id: 'sim_contact_2', 
            name: 'Maria Oliveira', 
            number: '5511999992222',
            isMyContact: true,
            isGroup: false
          },
          { 
            id: 'sim_contact_3', 
            name: 'Carlos Pereira', 
            number: '5511999993333',
            isMyContact: true,
            isGroup: false
          },
        ];
      }

      // Em produção, busca os contatos reais
      const contacts = await this.client.getContacts();
      
      return contacts
        .filter(contact => !contact.isMe && !contact.isGroup && contact.name) // Filtra apenas contatos reais
        .map(contact => {
          return {
            id: contact.id._serialized,
            name: contact.name || contact.pushname || 'Unknown',
            number: contact.number,
            profilePicUrl: contact.profilePicUrl,
            isMyContact: contact.isMyContact,
            isGroup: contact.isGroup
          };
        });
    } catch (error) {
      log(`Error getting WhatsApp contacts: ${error}`, "whatsapp");
      throw error;
    }
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<string | null> {
    if (!this.isAuthenticated) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Em modo simulado, apenas logamos a mensagem
      if (this.isDevelopment || process.env.NODE_ENV !== 'production' || !this.client || process.env.FORCE_DEV_MODE === 'true') {
        log(`[DEV] Sending message to group ${groupId}: ${message}`, "whatsapp");
        return `mock_group_message_${Date.now()}`;
      }

      // Em produção, enviamos para o grupo real
      const response = await this.client.sendMessage(groupId, message);
      return response.id._serialized;
    } catch (error) {
      log(`Error sending WhatsApp message to group: ${error}`, "whatsapp");
      throw error;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, "");
    
    // If the number doesn't start with a '+', add the default country code
    if (!cleaned.startsWith("55") && cleaned.length === 11) {
      cleaned = `55${cleaned}`;
    }
    
    return cleaned;
  }
}

// Create a singleton instance
export const whatsappClient = new WhatsAppClient();
