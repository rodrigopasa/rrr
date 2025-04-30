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
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      log("Initializing WhatsApp client...", "whatsapp");
      
      // In development or testing mode, we simulate a successful client
      // This avoids the Puppeteer issues in environments like Replit
      if (this.isDevelopment || process.env.NODE_ENV !== 'production') {
        log("Starting WhatsApp in development/test mode (simulated)", "whatsapp");
        this.isInitialized = true;
        this.isAuthenticated = true;
        
        // Simulate a QR code for development testing (base64 encoded image)
        this.qrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAA1BMVEX///+nxBvIAAAASElEQVR4nO3BMQEAAADCIPuntsYOYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA98PAABpHAX+QAAAABJRU5ErkJggg==";
        
        setTimeout(() => {
          // After a few seconds, simulate the client being ready
          this.emit("ready");
          log("WhatsApp client initialized in development mode", "whatsapp");
        }, 2000);
        
        return;
      }
      
      // For production environment, create the actual WhatsApp client
      log("Starting WhatsApp in production mode with Puppeteer", "whatsapp");
      this.client = new Client({
        puppeteer: {
          headless: true,
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
          // These settings help with stability in container environments
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          defaultViewport: { width: 1280, height: 800 }
        },
      });
      
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
      
      // In development mode, simulate sending message
      if (this.isDevelopment || !this.client) {
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
