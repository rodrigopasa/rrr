import { Client } from "whatsapp-web.js";
import { log } from "./vite";
import qrcode from "qrcode";
import { EventEmitter } from "events";
import { storage } from './storage';

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
  private isDevelopment = false; // Forçado para produção

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      log("Initializing WhatsApp client...", "whatsapp");
      
      // Usar a API real do WhatsApp Web.js
      log("Starting WhatsApp with WhatsApp Web.js", "whatsapp");
      
      // Iniciar cliente com autenticação local
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'automizap-client'
        }),
        puppeteer: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
          headless: true
        }
      });
      
      // Escutar o evento de QR code
      this.client.on('qr', async (qrCode) => {
        log("QR Code recebido do WhatsApp Web", "whatsapp");
        
        // Converter o código QR para uma URL de imagem
        try {
          this.qrCode = await new Promise<string>((resolve, reject) => {
            qrcode.toDataURL(qrCode, (err, url) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(url);
            });
          });
          
          // Emitir o evento de QR
          this.emit("qr", this.qrCode);
          log("QR Code gerado com sucesso para escanear", "whatsapp");
        } catch (qrError) {
          log(`Erro ao gerar QR code: ${qrError}`, "whatsapp");
        }
      });
      
      // Escutar evento de autenticação
      this.client.on('authenticated', () => {
        log("WhatsApp autenticado com sucesso!", "whatsapp");
        this.isAuthenticated = true;
        this.qrCode = null; // Limpar QR code
      });
      
      // Escutar evento de pronto
      this.client.on('ready', () => {
        log("WhatsApp pronto para uso!", "whatsapp");
        this.isAuthenticated = true;
        this.isInitialized = true;
        this.emit("ready");
      });
      
      // Escutar desconexão
      this.client.on('disconnected', (reason) => {
        log(`WhatsApp desconectado: ${reason}`, "whatsapp");
        this.isAuthenticated = false;
        this.isInitialized = false;
        
        // Tentar reconectar
        setTimeout(() => this.initialize(), 5000);
      });
      
      // Iniciar o cliente
      await this.client.initialize();
      this.isInitialized = true;
      
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
    if (!this.isAuthenticated || !this.client) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Format the number to international format if needed
      const formattedNumber = this.formatPhoneNumber(to);
      
      // Verificar se o número é válido antes de tentar enviar
      if (!formattedNumber || formattedNumber.length < 12) {
        log(`Invalid phone number format: ${to} -> ${formattedNumber}`, "whatsapp");
        throw new Error(`Número inválido: ${to}. O formato correto deve ter código do país + DDD + número.`);
      }
      
      // Preparar o número para o formato esperado pela API
      const chatId = `${formattedNumber}@c.us`;
      
      // Enviar a mensagem usando o cliente real
      log(`Sending message to ${formattedNumber}: ${message}`, "whatsapp");
      const result = await this.client.sendMessage(chatId, message);
      
      // Retornar o ID da mensagem
      return result.id._serialized;
    } catch (error) {
      log(`Error sending WhatsApp message: ${error}`, "whatsapp");
      throw error;
    }
  }

  async sendBulkMessages(
    message: ScheduledMessage
  ): Promise<{ successful: string[]; failed: string[] }> {
    if (!this.isAuthenticated || !this.client) {
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
  
  // Método para desconectar o WhatsApp e forçar um novo QR code
  async disconnect(): Promise<boolean> {
    try {
      log("Desconectando cliente do WhatsApp...", "whatsapp");
      
      if (this.client) {
        // Tentar desconectar o cliente atual
        await this.client.destroy();
        this.client = null;
      }
      
      // Redefinir estado
      this.isAuthenticated = false;
      this.qrCode = null;
      this.authenticatedUsers.clear();
      
      // Reiniciar o processo de inicialização para gerar um novo QR code
      await this.initialize();
      
      return true;
    } catch (error) {
      log(`Erro ao desconectar WhatsApp: ${error}`, "whatsapp");
      return false;
    }
  }

  async getWhatsAppChats(): Promise<WhatsAppChat[]> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      log(`Getting WhatsApp chats...`, "whatsapp");
      
      // Obter chats reais do WhatsApp
      const chats = await this.client.getChats();
      
      // Converter para o formato esperado
      const formattedChats: WhatsAppChat[] = chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || 'Chat sem nome',
        isGroup: chat.isGroup,
        participantsCount: chat.isGroup ? 0 : undefined, // Em uma implementação real, obteríamos isso de chat.groupMetadata.participants.length
        timestamp: chat.timestamp || Date.now(),
        unreadCount: chat.unreadCount || 0
      }));
      
      // Armazenar no banco de dados para persistência
      // Este é um bom lugar para implementar a persistência com nosso esquema de banco de dados
      
      return formattedChats;
    } catch (error) {
      log(`Error getting WhatsApp chats: ${error}`, "whatsapp");
      // Em caso de erro, tenta buscar do banco de dados se implementado
      return [];
    }
  }

  async getWhatsAppGroups(): Promise<WhatsAppChat[]> {
    try {
      const chats = await this.getWhatsAppChats();
      return chats.filter(chat => chat.isGroup);
    } catch (error) {
      log(`Error getting WhatsApp groups: ${error}`, "whatsapp");
      // Em caso de erro, tenta buscar do banco de dados
      return [];
    }
  }

  async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      log(`Getting WhatsApp contacts...`, "whatsapp");
      
      // Obter contatos reais do WhatsApp
      const contacts = await this.client.getContacts();
      
      // Converter para o formato esperado
      const formattedContacts: WhatsAppContact[] = contacts
        .filter(contact => !contact.isMe && contact.id._serialized.endsWith('@c.us'))
        .map(contact => {
          // As propriedades podem variar dependendo da versão da biblioteca
          return {
            id: contact.id._serialized,
            name: contact.name || contact.pushname || 'Sem nome',
            number: contact.id.user, // O número sem o @c.us
            profilePicUrl: undefined, // Na implementação real, usaríamos contact.getProfilePicUrl()
            isMyContact: !!contact.isMyContact,
            isGroup: false
          };
        });
      
      // Armazenar no banco de dados para persistência
      // Este é um bom lugar para implementar a persistência
      
      return formattedContacts;
    } catch (error) {
      log(`Error getting WhatsApp contacts: ${error}`, "whatsapp");
      // Em caso de erro, tenta buscar do banco de dados
      return [];
    }
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<string | null> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Verificar se o ID do grupo está no formato correto
      // Os IDs de grupo geralmente terminam com @g.us
      const chatId = groupId.endsWith('@g.us') ? groupId : `${groupId}@g.us`;
      
      log(`Sending message to group ${chatId}: ${message}`, "whatsapp");
      
      // Enviar a mensagem para o grupo usando o cliente real
      const result = await this.client.sendMessage(chatId, message);
      
      // Retornar o ID da mensagem
      return result.id._serialized;
    } catch (error) {
      log(`Error sending WhatsApp message to group: ${error}`, "whatsapp");
      throw error;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Se começar com +, remover o + e manter o restante dos dígitos
    if (phoneNumber.startsWith("+")) {
      return phoneNumber.substring(1).replace(/\D/g, "");
    }
    
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, "");
    
    // Se o número já começar com 55 (Brasil), mantém como está
    if (cleaned.startsWith("55") && cleaned.length >= 12) {
      return cleaned;
    }
    
    // Se o número tiver 10-11 dígitos (DDD + número local), adiciona 55 da frente
    if (cleaned.length >= 10 && cleaned.length <= 11) {
      return `55${cleaned}`;
    }
    
    // Se não se encaixar em nenhum padrão acima, retorna como está
    return cleaned;
  }
}

// Create a singleton instance
export const whatsappClient = new WhatsAppClient();
