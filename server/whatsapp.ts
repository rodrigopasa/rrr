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
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      log("Initializing WhatsApp client...", "whatsapp");
      
      // Usar a API real do WhatsApp Web.js
      log("Starting WhatsApp with WhatsApp Web.js", "whatsapp");
      
      // Iniciar cliente com autenticação padrão para garantir QR Code real e funcional
      this.client = new Client({
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
      log("WhatsApp client not ready or authenticated for sending messages - using compatibility mode", "whatsapp");
      
      // Em ambiente de desenvolvimento sem o cliente WhatsApp, retornamos um ID falso
      // para permitir que o fluxo continue sendo testado
      if (process.env.NODE_ENV === 'development') {
        const mockMessageId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        log(`DEV MODE: Simulating message sent to ${to} with ID: ${mockMessageId}`, "whatsapp");
        return mockMessageId;
      }
      
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
      
      // Log detalhe para debug
      log(`Sending message to ${formattedNumber} (${chatId}): ${message.substring(0, 30)}...`, "whatsapp");
      
      // Tenta executar o envio várias vezes se necessário
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        try {
          // Enviar a mensagem usando o cliente real
          const result = await this.client.sendMessage(chatId, message);
          
          // Retornar o ID da mensagem
          log(`Message sent successfully to ${formattedNumber}`, "whatsapp");
          return result.id._serialized;
        } catch (sendError) {
          lastError = sendError;
          log(`Attempt ${attempts + 1}/${maxAttempts} failed: ${sendError}`, "whatsapp");
          attempts++;
          
          // Esperar um pouco antes de tentar novamente
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      log(`All ${maxAttempts} attempts to send message failed: ${lastError}`, "whatsapp");
      throw lastError;
    } catch (error) {
      log(`Error sending WhatsApp message: ${error}`, "whatsapp");
      throw error;
    }
  }

  async sendBulkMessages(
    message: ScheduledMessage
  ): Promise<{ successful: string[]; failed: string[] }> {
    if (!this.isAuthenticated || !this.client) {
      log("WhatsApp client not ready for bulk messages - using compatibility mode", "whatsapp");
      
      // Em ambiente de desenvolvimento, simulamos o envio para permitir testes
      if (process.env.NODE_ENV === 'development') {
        log(`DEV MODE: Simulating bulk message send to ${message.recipients.length} recipients`, "whatsapp");
        
        // Simulando alguns sucessos e falhas para testar cenários reais
        const successful = message.recipients.slice(0, Math.ceil(message.recipients.length * 0.8));
        const failed = message.recipients.slice(Math.ceil(message.recipients.length * 0.8));
        
        return { successful, failed };
      }
      
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    const successful: string[] = [];
    const failed: string[] = [];
    
    log(`Sending bulk messages to ${message.recipients.length} recipients`, "whatsapp");

    // Shuffle recipients para evitar padrões de envio detectáveis
    const shuffledRecipients = [...message.recipients].sort(() => Math.random() - 0.5);
    
    for (const recipient of shuffledRecipients) {
      try {
        log(`Preparing to send to: ${recipient}`, "whatsapp");
        
        // Variação aleatória do delay entre mensagens (entre 1-3 segundos)
        const delay = 1000 + Math.floor(Math.random() * 2000);
        
        // Tentar enviar a mensagem
        const messageId = await this.sendMessage(recipient, message.content);
        
        if (messageId) {
          log(`Successfully sent to ${recipient}`, "whatsapp");
          successful.push(recipient);
        } else {
          log(`No message ID returned for ${recipient}`, "whatsapp");
          failed.push(recipient);
        }
      } catch (error) {
        log(`Failed to send message to ${recipient}: ${error}`, "whatsapp");
        failed.push(recipient);
      }

      // Delay variável entre mensagens para evitar detecção de automação
      const randomDelay = 1000 + Math.floor(Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
    }

    log(`Bulk message sending complete: ${successful.length} successful, ${failed.length} failed`, "whatsapp");
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
      log("WhatsApp client not ready for getting chats - using compatibility mode", "whatsapp");
      
      // Em ambiente de desenvolvimento, retornamos dados simulados
      if (process.env.NODE_ENV === 'development') {
        log(`DEV MODE: Returning mock chats`, "whatsapp");
        return Array(5).fill(0).map((_, i) => ({
          id: `mock_chat_${i}_${Date.now()}`,
          name: `Chat de Teste ${i+1}`,
          isGroup: i % 2 === 0,
          participantsCount: i % 2 === 0 ? Math.floor(Math.random() * 20) + 5 : undefined,
          timestamp: Date.now() - (i * 3600000),
          unreadCount: Math.floor(Math.random() * 10)
        }));
      }
      
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
      log(`Getting WhatsApp groups...`, "whatsapp");
      
      if (!this.isAuthenticated || !this.client) {
        log("WhatsApp client not ready for getting groups - using compatibility mode", "whatsapp");
        
        // Em ambiente de desenvolvimento, retornamos dados simulados
        if (process.env.NODE_ENV === 'development') {
          log(`DEV MODE: Returning mock groups`, "whatsapp");
          return Array(3).fill(0).map((_, i) => ({
            id: `mock_group_${i}_${Date.now()}`,
            name: `Grupo de Teste ${i+1}`,
            isGroup: true,
            participantsCount: Math.floor(Math.random() * 30) + 10,
            timestamp: Date.now() - (i * 7200000),
            unreadCount: Math.floor(Math.random() * 5)
          }));
        }
        
        throw new Error("WhatsApp client not ready or not authenticated");
      }
      
      // Tentar obter grupos diretamente (mais eficiente)
      try {
        const chats = await this.client.getChats();
        const groupChats = chats.filter(chat => chat.isGroup);
        
        // Formatando grupos
        const formattedGroups: WhatsAppChat[] = await Promise.all(
          groupChats.map(async (group) => {
            let participantsCount = 0;
            
            // Tentar obter metadata do grupo incluindo contagem de participantes
            try {
              // A API WhatsApp Web.js tem uma estrutura específica para metadados
              // que pode variar de acordo com a versão da biblioteca
              // Estamos usando uma abordagem mais segura com type assertion
              const groupAny = group as any;
              
              if (groupAny.groupMetadata) {
                participantsCount = (groupAny.groupMetadata.participants || []).length;
              } else if (typeof groupAny.getMetadata === 'function') {
                // Tentar obter metadata se não estiver já carregada e o método existir
                try {
                  const metadata = await groupAny.getMetadata();
                  participantsCount = (metadata?.participants || []).length;
                } catch (innerError) {
                  log(`Cannot get group metadata: ${innerError}`, "whatsapp");
                }
              }
            } catch (metaError) {
              log(`Error getting group metadata: ${metaError}`, "whatsapp");
            }
            
            return {
              id: group.id._serialized,
              name: group.name || 'Grupo sem nome',
              isGroup: true,
              participantsCount,
              timestamp: group.timestamp || Date.now(),
              unreadCount: group.unreadCount || 0
            };
          })
        );
        
        // Salvar grupos no banco de dados para persistência
        try {
          // TODO: Implementar persistência dos grupos no banco
          // Este código seria utilizado para salvar grupos no banco
          // Exemplo:
          // for (const group of formattedGroups) {
          //   await storage.createOrUpdateWhatsappGroup({
          //     whatsappId: group.id,
          //     name: group.name,
          //     participantsCount: group.participantsCount,
          //     lastActivity: new Date(group.timestamp)
          //   });
          // }
          
          log(`Successfully retrieved ${formattedGroups.length} WhatsApp groups`, "whatsapp");
        } catch (dbError) {
          log(`Error saving WhatsApp groups to database: ${dbError}`, "whatsapp");
        }
        
        return formattedGroups;
      } catch (error) {
        log(`Error getting WhatsApp groups directly: ${error}`, "whatsapp");
        throw error; // Propagar para usar o fallback abaixo
      }
    } catch (error) {
      log(`Error getting WhatsApp groups: ${error}`, "whatsapp");
      
      // Fallback: tentar obter do banco de dados
      try {
        // TODO: Implementar recuperação de grupos do banco
        // Exemplo:
        // const savedGroups = await storage.getWhatsAppGroups();
        // return savedGroups.map(g => ({
        //   id: g.whatsappId,
        //   name: g.name,
        //   isGroup: true,
        //   participantsCount: g.participantsCount,
        //   timestamp: g.lastActivity.getTime(),
        //   unreadCount: 0
        // }));
        
        log(`Fallback: Could not retrieve WhatsApp groups`, "whatsapp");
        return []; 
      } catch (dbError) {
        log(`Error getting WhatsApp groups from database: ${dbError}`, "whatsapp");
        return [];
      }
    }
  }

  async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    if (!this.isAuthenticated || !this.client) {
      log("WhatsApp client not ready for getting contacts - using compatibility mode", "whatsapp");
      
      // Em ambiente de desenvolvimento, retornamos dados simulados
      if (process.env.NODE_ENV === 'development') {
        log(`DEV MODE: Returning mock contacts`, "whatsapp");
        return Array(8).fill(0).map((_, i) => ({
          id: `mock_contact_${i}_${Date.now()}@c.us`,
          name: `Contato Teste ${i+1}`,
          number: `55119${Math.floor(10000000 + Math.random() * 90000000)}`,
          profilePicUrl: undefined,
          isMyContact: true,
          isGroup: false
        }));
      }
      
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
      try {
        // TODO: Implementar persistência no banco
        // Este código seria utilizado para salvar contatos no banco de dados
        // Exemplo:
        // for (const contact of formattedContacts) {
        //   await storage.createWhatsAppContact({
        //     whatsappId: contact.id,
        //     name: contact.name,
        //     phoneNumber: contact.number,
        //     isGroup: false,
        //     userId: 1 // ID do usuário autenticado
        //   });
        // }
        
        log(`Successfully retrieved ${formattedContacts.length} WhatsApp contacts`, "whatsapp");
      } catch (dbError) {
        log(`Error saving WhatsApp contacts to database: ${dbError}`, "whatsapp");
      }
      
      return formattedContacts;
    } catch (error) {
      log(`Error getting WhatsApp contacts: ${error}`, "whatsapp");
      
      // Em caso de erro, tenta buscar do banco de dados
      try {
        // TODO: Implementar recuperação a partir do banco
        // Exemplo:
        // const savedContacts = await storage.getWhatsAppContacts(1); // ID do usuário
        // return savedContacts.map(c => ({
        //   id: c.whatsappId,
        //   name: c.name,
        //   number: c.phoneNumber,
        //   isMyContact: true,
        //   isGroup: c.isGroup,
        //   profilePicUrl: undefined
        // }));
        
        log(`Fallback: Could not retrieve WhatsApp contacts`, "whatsapp");
        return [];
      } catch (dbError) {
        log(`Error getting WhatsApp contacts from database: ${dbError}`, "whatsapp");
        return [];
      }
    }
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<string | null> {
    if (!this.isAuthenticated || !this.client) {
      log("WhatsApp client not ready for sending group messages - using compatibility mode", "whatsapp");
      
      // Em ambiente de desenvolvimento, retornamos um ID falso
      if (process.env.NODE_ENV === 'development') {
        const mockMessageId = `mock_group_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        log(`DEV MODE: Simulating message sent to group ${groupId} with ID: ${mockMessageId}`, "whatsapp");
        return mockMessageId;
      }
      
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
