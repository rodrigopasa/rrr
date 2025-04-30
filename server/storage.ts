import { 
  users, contacts, contactGroups, messages, messageRecipients,
  type User, type InsertUser, type Contact, type InsertContact,
  type ContactGroup, type InsertContactGroup, type Message, type InsertMessage,
  type MessageRecipient, type InsertMessageRecipient
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact operations
  getContacts(userId: number, search?: string): Promise<Contact[]>;
  getContactsByIds(userId: number, ids: string[]): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  createContacts(contacts: InsertContact[]): Promise<Contact[]>;
  deleteContacts(userId: number, contactIds: string[]): Promise<void>;
  
  // Group operations
  getGroups(userId: number): Promise<ContactGroup[]>;
  createGroup(group: InsertContactGroup): Promise<ContactGroup>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId: number, filters?: { search?: string, status?: string }): Promise<any[]>;
  getRecentMessages(userId: number, limit?: number): Promise<any[]>;
  
  // Message recipients operations
  addMessageRecipients(recipients: InsertMessageRecipient[]): Promise<MessageRecipient[]>;
  
  // Schedule operations
  getScheduledMessages(userId: number, filters?: { search?: string, type?: string }): Promise<any[]>;
  getUpcomingSchedules(userId: number, limit?: number): Promise<any[]>;
  
  // Dashboard operations
  getDashboardStats(userId: number): Promise<{
    totalContacts: number;
    messagesSent: number;
    scheduledMessages: number;
    deliveryRate: number;
  }>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contactsStore: Map<number, Contact>;
  private groupsStore: Map<number, ContactGroup>;
  private messagesStore: Map<number, Message>;
  private messageRecipientsStore: Map<number, MessageRecipient>;
  currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.contactsStore = new Map();
    this.groupsStore = new Map();
    this.messagesStore = new Map();
    this.messageRecipientsStore = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Contact methods
  async getContacts(userId: number, search: string = ""): Promise<Contact[]> {
    const userContacts = Array.from(this.contactsStore.values()).filter(
      (contact) => contact.userId === userId
    );

    if (!search) return userContacts;

    return userContacts.filter(
      (contact) => 
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.phone.includes(search)
    );
  }

  async getContactsByIds(userId: number, ids: string[]): Promise<Contact[]> {
    return Array.from(this.contactsStore.values()).filter(
      (contact) => contact.userId === userId && ids.includes(String(contact.id))
    );
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentId++;
    const createdAt = new Date();
    const newContact: Contact = { ...contact, id, createdAt };
    this.contactsStore.set(id, newContact);
    return newContact;
  }

  async createContacts(contacts: InsertContact[]): Promise<Contact[]> {
    const createdContacts: Contact[] = [];
    for (const contact of contacts) {
      createdContacts.push(await this.createContact(contact));
    }
    return createdContacts;
  }

  async deleteContacts(userId: number, contactIds: string[]): Promise<void> {
    for (const id of contactIds) {
      const contactId = parseInt(id);
      const contact = this.contactsStore.get(contactId);
      if (contact && contact.userId === userId) {
        this.contactsStore.delete(contactId);
      }
    }
  }

  // Group methods
  async getGroups(userId: number): Promise<ContactGroup[]> {
    return Array.from(this.groupsStore.values()).filter(
      (group) => group.userId === userId
    );
  }

  async createGroup(group: InsertContactGroup): Promise<ContactGroup> {
    const id = this.currentId++;
    const createdAt = new Date();
    const newGroup: ContactGroup = { ...group, id, createdAt };
    this.groupsStore.set(id, newGroup);
    return newGroup;
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentId++;
    const createdAt = new Date();
    const newMessage: Message = { ...message, id, createdAt };
    this.messagesStore.set(id, newMessage);
    return newMessage;
  }

  async getMessages(userId: number, filters: { search?: string, status?: string } = {}): Promise<any[]> {
    let userMessages = Array.from(this.messagesStore.values()).filter(
      (message) => message.userId === userId
    );

    if (filters.search) {
      userMessages = userMessages.filter(message => 
        message.subject?.toLowerCase().includes(filters.search!.toLowerCase()) ||
        message.content.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.status && filters.status !== "all") {
      userMessages = userMessages.filter(message => message.status === filters.status);
    }

    // For demonstration, we'll return enriched messages with recipient counts
    return userMessages.map(message => {
      const recipients = Array.from(this.messageRecipientsStore.values()).filter(
        recipient => recipient.messageId === message.id
      );

      // Get a summary of recipients
      const recipientDetails = recipients.length > 0 
        ? `${recipients.length} contatos` 
        : "Nenhum destinatário";

      // Calculate sent time (either scheduled time if scheduled, or sentAt if sent)
      const sentAt = message.sentAt || message.scheduledAt || message.createdAt;

      // Determine message type (individual vs group)
      const type = recipients.length > 1 ? "group" : "individual";

      return {
        id: String(message.id),
        title: message.subject || "Sem assunto",
        recipients: recipientDetails,
        status: message.status,
        type,
        sentAt: sentAt?.toISOString()
      };
    });
  }

  async getRecentMessages(userId: number, limit: number = 4): Promise<any[]> {
    // Get all messages for the user
    const messages = await this.getMessages(userId);
    
    // Sort by sentAt or createdAt in descending order
    messages.sort((a, b) => {
      const dateA = new Date(a.sentAt);
      const dateB = new Date(b.sentAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Limit and format for the UI
    return messages.slice(0, limit).map(message => {
      let icon = "ri-message-3-line";
      let iconBgColor = "bg-blue-100";
      let iconColor = "text-blue-600";

      // Randomize the icon colors for demonstration
      const colorIndex = Math.floor(Math.random() * 4);
      switch (colorIndex) {
        case 0:
          iconBgColor = "bg-purple-100";
          iconColor = "text-purple-600";
          break;
        case 1:
          iconBgColor = "bg-blue-100";
          iconColor = "text-blue-600";
          break;
        case 2:
          iconBgColor = "bg-green-100";
          iconColor = "text-green-600";
          break;
        case 3:
          iconBgColor = "bg-yellow-100";
          iconColor = "text-yellow-600";
          break;
      }

      // Format the time
      const date = new Date(message.sentAt);
      const now = new Date();
      let time;
      
      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        time = `Hoje, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } 
      // If yesterday, show "Ontem"
      else if (new Date(now.getTime() - 86400000).toDateString() === date.toDateString()) {
        time = `Ontem, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      // Otherwise show date
      else {
        time = date.toLocaleDateString();
      }

      return {
        id: message.id,
        title: message.title,
        description: message.recipients,
        icon,
        iconBgColor,
        iconColor,
        time
      };
    });
  }

  // Message recipients methods
  async addMessageRecipients(recipients: InsertMessageRecipient[]): Promise<MessageRecipient[]> {
    const createdRecipients: MessageRecipient[] = [];
    
    for (const recipient of recipients) {
      const id = this.currentId++;
      const createdAt = new Date();
      const newRecipient: MessageRecipient = { ...recipient, id, createdAt };
      this.messageRecipientsStore.set(id, newRecipient);
      createdRecipients.push(newRecipient);
    }
    
    return createdRecipients;
  }

  // Schedule methods
  async getScheduledMessages(userId: number, filters: { search?: string, type?: string } = {}): Promise<any[]> {
    // Get scheduled messages
    let scheduledMessages = Array.from(this.messagesStore.values()).filter(
      message => message.userId === userId && message.isScheduled
    );

    if (filters.search) {
      scheduledMessages = scheduledMessages.filter(message => 
        message.subject?.toLowerCase().includes(filters.search!.toLowerCase()) ||
        message.content.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    return scheduledMessages.map(message => {
      const recipients = Array.from(this.messageRecipientsStore.values()).filter(
        recipient => recipient.messageId === message.id
      );

      // Get recipient count
      const recipientCount = recipients.length;
      
      // Determine message type based on recipient count and random variation for demo
      let type: "individual" | "group" | "campaign" | "automation" = "individual";
      if (recipientCount > 1) {
        const typeIndex = Math.floor(Math.random() * 3);
        type = ["group", "campaign", "automation"][typeIndex] as any;
      }

      return {
        id: String(message.id),
        title: message.subject || "Mensagem agendada",
        recipients: recipientCount === 1 ? "Contato individual" : "Múltiplos contatos",
        recipientCount,
        type,
        scheduledFor: message.scheduledAt?.toISOString() || new Date().toISOString()
      };
    });
  }

  async getUpcomingSchedules(userId: number, limit: number = 3): Promise<any[]> {
    // Get all scheduled messages
    const scheduledMessages = await this.getScheduledMessages(userId);
    
    // Filter for messages scheduled in the future
    const now = new Date();
    const futureSchedules = scheduledMessages.filter(
      message => new Date(message.scheduledFor) > now
    );
    
    // Sort by scheduled date in ascending order
    futureSchedules.sort((a, b) => {
      const dateA = new Date(a.scheduledFor);
      const dateB = new Date(b.scheduledFor);
      return dateA.getTime() - dateB.getTime();
    });

    // Return limited results
    return futureSchedules.slice(0, limit);
  }

  // Dashboard methods
  async getDashboardStats(userId: number): Promise<{
    totalContacts: number;
    messagesSent: number;
    scheduledMessages: number;
    deliveryRate: number;
  }> {
    // Get counts from our collections
    const userContacts = Array.from(this.contactsStore.values()).filter(
      contact => contact.userId === userId
    );
    
    const userMessages = Array.from(this.messagesStore.values()).filter(
      message => message.userId === userId
    );
    
    const sentMessages = userMessages.filter(
      message => message.status === "sent" || message.status === "delivered"
    );
    
    const scheduledMessages = userMessages.filter(
      message => message.isScheduled && message.scheduledAt && message.scheduledAt > new Date()
    );
    
    // Calculate delivery rate
    const deliveredMessages = userMessages.filter(
      message => message.status === "delivered"
    );
    
    const deliveryRate = sentMessages.length > 0
      ? (deliveredMessages.length / sentMessages.length) * 100
      : 100; // If no messages, then 100% delivery rate

    return {
      totalContacts: userContacts.length,
      messagesSent: sentMessages.length,
      scheduledMessages: scheduledMessages.length,
      deliveryRate: Math.round(deliveryRate * 10) / 10 // Round to 1 decimal place
    };
  }
}

export const storage = new MemStorage();

// Create an initial admin user for testing
(async () => {
  try {
    // Check if admin user already exists
    const existingUser = await storage.getUserByUsername('admin');
    
    if (existingUser) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Create admin user with a simple hash (for testing only)
    const user = await storage.createUser({
      username: 'admin',
      password: 'admin123_hashed',
      email: 'admin@example.com'
    });
    
    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
})();
