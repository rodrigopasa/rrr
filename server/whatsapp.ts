import { Client } from "whatsapp-web.js";
import { log } from "./vite";
import qrcode from "qrcode";
import { EventEmitter } from "events";

// Custom type for message with additional properties
type ScheduledMessage = {
  id: string;
  userId: number;
  recipients: string[];
  content: string;
  subject?: string;
}

class WhatsAppClient extends EventEmitter {
  private client: Client | null = null;
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
      log("Initializing WhatsApp client...", "whatsapp");
      
      this.client = new Client({
        puppeteer: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
          ],
        },
      });

      this.client.on("qr", (qr) => {
        log("QR Code received", "whatsapp");
        qrcode.toDataURL(qr, (err, url) => {
          if (err) {
            log(`Error generating QR code: ${err}`, "whatsapp");
            return;
          }
          this.qrCode = url;
          this.emit("qr", url);
        });
      });

      this.client.on("ready", () => {
        log("WhatsApp client is ready!", "whatsapp");
        this.isAuthenticated = true;
        this.isInitialized = true;
        this.qrCode = null;
        this.emit("ready");
      });

      this.client.on("authenticated", () => {
        log("WhatsApp authenticated", "whatsapp");
        this.isAuthenticated = true;
      });

      this.client.on("auth_failure", (msg) => {
        log(`WhatsApp authentication failed: ${msg}`, "whatsapp");
        this.isAuthenticated = false;
      });

      this.client.on("disconnected", (reason) => {
        log(`WhatsApp disconnected: ${reason}`, "whatsapp");
        this.isAuthenticated = false;
        this.isInitialized = false;
        this.initialize();
      });

      await this.client.initialize();
    } catch (error) {
      log(`Error initializing WhatsApp: ${error}`, "whatsapp");
      this.isInitialized = false;
      this.isAuthenticated = false;
      // Retry initialization after a delay
      setTimeout(() => this.initialize(), 10000);
    }
  }

  async sendMessage(to: string, message: string): Promise<string | null> {
    if (!this.client || !this.isAuthenticated) {
      throw new Error("WhatsApp client not ready or not authenticated");
    }

    try {
      // Format the number to international format if needed
      const formattedNumber = this.formatPhoneNumber(to);
      
      // Send the message
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
    if (!this.client || !this.isAuthenticated) {
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
