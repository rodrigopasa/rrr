// Versão compatível com Replit para desenvolvimento
// Este arquivo seria substituído em produção pelo client real do whatsapp-web.js
import { log } from "./vite";
import qrcode from "qrcode";
import { EventEmitter } from "events";
import { storage } from './storage';

// Types
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

type ScheduledMessage = {
  id: string;
  userId: number;
  recipients: string[];
  content: string;
  subject?: string;
  isGroup?: boolean;
}

class WhatsAppClient extends EventEmitter {
  private isInitialized = false;
  private isAuthenticated = false;
  private authenticatedUsers = new Set<number>();
  private qrCode: string | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      log("Initializing WhatsApp client emulator for development...", "whatsapp");
      
      // Generate a mock QR code after a short delay
      setTimeout(() => {
        this.generateMockQR();
      }, 2000);
      
    } catch (error) {
      log(`Error initializing mock WhatsApp: ${error}`, "whatsapp");
      
      // Try to reinitialize
      setTimeout(() => this.initialize(), 5000);
    }
  }
  
  private generateMockQR() {
    // Generate a mock QR code (data URL)
    qrcode.toDataURL("MOCK_WHATSAPP_SESSION_FOR_REPLIT", (err, url) => {
      if (err) {
        log(`Error generating mock QR code: ${err}`, "whatsapp");
        return;
      }
      
      this.qrCode = url;
      this.emit("qr", this.qrCode);
      log("Mock QR code generated for development environment", "whatsapp");
      
      // Auto-authenticate after 5 seconds
      setTimeout(() => {
        this.isAuthenticated = true;
        this.isInitialized = true;
        this.qrCode = null;
        this.emit("ready");
        log("Mock WhatsApp client auto-authenticated for development", "whatsapp");
      }, 5000);
    });
  }

  async sendMessage(to: string, message: string): Promise<string | null> {
    // Format or validate the phone number
    const formattedNumber = this.formatPhoneNumber(to);
    
    if (!formattedNumber || formattedNumber.length < 10) {
      log(`Invalid phone number format: ${to}`, "whatsapp");
      throw new Error(`Número inválido: ${to}. Formato esperado: código do país + DDD + número`);
    }
    
    // Log the message sending for development purposes
    log(`DEV MODE: Sending message to ${formattedNumber}: ${message.substring(0, 30)}...`, "whatsapp");
    
    // Return a mock message ID
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return mockId;
  }

  async sendBulkMessages(message: ScheduledMessage): Promise<{ successful: string[]; failed: string[] }> {
    log(`DEV MODE: Sending bulk messages to ${message.recipients.length} recipients`, "whatsapp");
    
    // For development, simulate success for most recipients and some failures
    const successRate = 0.9; // 90% success rate for testing
    const successful: string[] = [];
    const failed: string[] = [];
    
    for (const recipient of message.recipients) {
      // Random success or failure based on our success rate
      if (Math.random() < successRate) {
        successful.push(recipient);
        log(`Mock success for recipient: ${recipient}`, "whatsapp");
      } else {
        failed.push(recipient);
        log(`Mock failure for recipient: ${recipient}`, "whatsapp");
      }
      
      // Add a small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
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
  
  async disconnect(): Promise<boolean> {
    this.isAuthenticated = false;
    this.isInitialized = false;
    this.qrCode = null;
    this.authenticatedUsers.clear();
    
    log("Mock WhatsApp client disconnected", "whatsapp");
    
    // Regenerate QR code
    setTimeout(() => {
      this.generateMockQR();
    }, 2000);
    
    return true;
  }

  async getWhatsAppChats(): Promise<WhatsAppChat[]> {
    return Array(5).fill(0).map((_, i) => ({
      id: `mock_chat_${i}_${Date.now()}`,
      name: `Chat de Teste ${i+1}`,
      isGroup: i % 2 === 0,
      participantsCount: i % 2 === 0 ? Math.floor(Math.random() * 20) + 5 : undefined,
      timestamp: Date.now() - (i * 3600000),
      unreadCount: Math.floor(Math.random() * 10)
    }));
  }

  async getWhatsAppGroups(): Promise<WhatsAppChat[]> {
    return Array(3).fill(0).map((_, i) => ({
      id: `mock_group_${i}_${Date.now()}`,
      name: `Grupo de Teste ${i+1}`,
      isGroup: true,
      participantsCount: Math.floor(Math.random() * 20) + 5,
      timestamp: Date.now() - (i * 3600000),
      unreadCount: 0
    }));
  }

  async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    return Array(10).fill(0).map((_, i) => ({
      id: `mock_contact_${i}_${Date.now()}`,
      name: `Contato ${i+1}`,
      number: `5511${9}${Math.floor(1000000 + Math.random() * 9000000)}`,
      isMyContact: Math.random() > 0.3,
      isGroup: false,
      profilePicUrl: i % 3 === 0 ? `https://randomuser.me/api/portraits/${i % 2 ? 'women' : 'men'}/${i+1}.jpg` : undefined
    }));
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<string | null> {
    log(`DEV MODE: Sending message to group ${groupId}: ${message.substring(0, 30)}...`, "whatsapp");
    return `mock_group_msg_${Date.now()}`;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure it has the country code
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = `55${cleaned}`;
    }
    
    return cleaned;
  }
}

export const whatsappClient = new WhatsAppClient();