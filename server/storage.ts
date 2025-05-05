import { users, contacts, contactGroups, messages, messageRecipients } from "@shared/schema";
import type { User, InsertUser, Contact, InsertContact, ContactGroup, InsertContactGroup, Message, InsertMessage, MessageRecipient, InsertMessageRecipient } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, or, isNull, not } from "drizzle-orm";
import { randomUUID } from "crypto";
import { pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUserIds(): Promise<number[]>; // Retorna IDs de todos os usuários
  
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
  updateMessageStatus(messageId: string, status: string): Promise<void>; // Atualiza o status da mensagem
  
  // Message recipients operations
  addMessageRecipients(recipients: InsertMessageRecipient[]): Promise<MessageRecipient[]>;
  
  // Schedule operations
  getScheduledMessages(userId: number, filters?: { search?: string, type?: string, status?: string }): Promise<any[]>;
  getUpcomingSchedules(userId: number, limit?: number): Promise<any[]>;
  
  // Dashboard operations
  getDashboardStats(userId: number): Promise<{
    totalContacts: number;
    messagesSent: number;
    scheduledMessages: number;
    deliveryRate: number;
  }>;

  // Direct message (no contact needed)
  sendDirectMessage(userId: number, phoneNumbers: string[], message: string, subject?: string): Promise<Message>;

  sessionStore: any; // Fix type issue with session store
}

// Use o banco de dados para armazenamento persistente
export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getAllUserIds(): Promise<number[]> {
    const result = await db.select({ id: users.id }).from(users);
    return result.map(user => user.id);
  }

  async getContacts(userId: number, search: string = ""): Promise<Contact[]> {
    if (search) {
      return db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            or(
              like(contacts.name, `%${search}%`),
              like(contacts.phone, `%${search}%`)
            )
          )
        );
    }
    return db.select().from(contacts).where(eq(contacts.userId, userId));
  }

  async getContactsByIds(userId: number, ids: string[]): Promise<Contact[]> {
    // Como estamos usando IDs como string, precisamos converter
    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    return db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          or(...numericIds.map(id => eq(contacts.id, id)))
        )
      );
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async createContacts(contactsList: InsertContact[]): Promise<Contact[]> {
    if (contactsList.length === 0) return [];
    
    const results = await db.insert(contacts).values(contactsList).returning();
    return results;
  }

  async deleteContacts(userId: number, contactIds: string[]): Promise<void> {
    // Como estamos usando IDs como string, precisamos converter
    const numericIds = contactIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    await db
      .delete(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          or(...numericIds.map(id => eq(contacts.id, id)))
        )
      );
  }

  async getGroups(userId: number): Promise<ContactGroup[]> {
    return db.select().from(contactGroups).where(eq(contactGroups.userId, userId));
  }

  async createGroup(group: InsertContactGroup): Promise<ContactGroup> {
    const [newGroup] = await db.insert(contactGroups).values(group).returning();
    return newGroup;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessages(userId: number, filters: { search?: string, status?: string } = {}): Promise<any[]> {
    // Consulta básica
    let query = db.select({
      id: messages.id,
      userId: messages.userId,
      subject: messages.subject,
      content: messages.content,
      isScheduled: messages.isScheduled,
      scheduledAt: messages.scheduledAt,
      sentAt: messages.sentAt,
      status: messages.status,
      createdAt: messages.createdAt,
      recipients: db.sql<string>`GROUP_CONCAT(DISTINCT ${messageRecipients.phoneNumber}, ', ')`
    })
    .from(messages)
    .leftJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
    .where(eq(messages.userId, userId))
    .groupBy(messages.id);

    // Adicionar filtros
    if (filters.search) {
      query = query.where(
        or(
          like(messages.subject || '', `%${filters.search}%`),
          like(messages.content, `%${filters.search}%`)
        )
      );
    }

    if (filters.status && filters.status !== 'all') {
      query = query.where(eq(messages.status, filters.status));
    }

    // Ordenar por data mais recente
    query = query.orderBy(desc(messages.createdAt));

    // Executar a consulta
    return query;
  }

  async getRecentMessages(userId: number, limit: number = 4): Promise<any[]> {
    return db.select({
      id: messages.id,
      subject: messages.subject,
      content: messages.content,
      status: messages.status,
      sentAt: messages.sentAt,
      recipientCount: db.sql<number>`COUNT(DISTINCT ${messageRecipients.id})`
    })
    .from(messages)
    .leftJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
    .where(
      and(
        eq(messages.userId, userId),
        not(eq(messages.status, 'draft')),
        isNull(messages.scheduledAt)
      )
    )
    .groupBy(messages.id)
    .orderBy(desc(messages.sentAt))
    .limit(limit);
  }

  async addMessageRecipients(recipients: InsertMessageRecipient[]): Promise<MessageRecipient[]> {
    if (recipients.length === 0) return [];
    
    const results = await db.insert(messageRecipients).values(recipients).returning();
    return results;
  }

  async getScheduledMessages(userId: number, filters: { search?: string, type?: string } = {}): Promise<any[]> {
    let query = db.select({
      id: messages.id,
      userId: messages.userId,
      subject: messages.subject,
      content: messages.content,
      scheduledAt: messages.scheduledAt,
      status: messages.status,
      createdAt: messages.createdAt,
      recipientCount: db.sql<number>`COUNT(DISTINCT ${messageRecipients.id})`
    })
    .from(messages)
    .leftJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.isScheduled, true),
        not(isNull(messages.scheduledAt))
      )
    )
    .groupBy(messages.id);

    // Adicionar filtros
    if (filters.search) {
      query = query.where(
        or(
          like(messages.subject || '', `%${filters.search}%`),
          like(messages.content, `%${filters.search}%`)
        )
      );
    }

    if (filters.type && filters.type !== 'all') {
      // Implementar filtro por tipo se necessário
    }

    // Ordenar por data de agendamento
    query = query.orderBy(messages.scheduledAt);

    return query;
  }

  async getUpcomingSchedules(userId: number, limit: number = 3): Promise<any[]> {
    const now = new Date();
    
    return db.select({
      id: messages.id,
      subject: messages.subject,
      scheduledAt: messages.scheduledAt,
      recipientCount: db.sql<number>`COUNT(DISTINCT ${messageRecipients.id})`
    })
    .from(messages)
    .leftJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.isScheduled, true),
        not(isNull(messages.scheduledAt))
      )
    )
    .groupBy(messages.id)
    .orderBy(messages.scheduledAt)
    .limit(limit);
  }

  async getDashboardStats(userId: number): Promise<{
    totalContacts: number;
    messagesSent: number;
    scheduledMessages: number;
    deliveryRate: number;
  }> {
    // Total de contatos
    const [{ count: totalContacts }] = await db
      .select({ count: db.fn.count() })
      .from(contacts)
      .where(eq(contacts.userId, userId));

    // Mensagens enviadas
    const [{ count: messagesSent }] = await db
      .select({ count: db.fn.count() })
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.status, 'sent')
        )
      );

    // Mensagens agendadas
    const [{ count: scheduledMessages }] = await db
      .select({ count: db.fn.count() })
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.isScheduled, true),
          eq(messages.status, 'scheduled')
        )
      );

    // Taxa de entrega
    const [{ delivered, total }] = await db
      .select({
        delivered: db.fn.count(
          db.sql`CASE WHEN ${messageRecipients.status} = 'delivered' THEN 1 END`
        ),
        total: db.fn.count()
      })
      .from(messageRecipients)
      .innerJoin(messages, eq(messageRecipients.messageId, messages.id))
      .where(eq(messages.userId, userId));

    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      totalContacts: Number(totalContacts),
      messagesSent: Number(messagesSent),
      scheduledMessages: Number(scheduledMessages),
      deliveryRate: Math.round(deliveryRate)
    };
  }

  // Método para enviar mensagem diretamente para números de telefone
  async sendDirectMessage(
    userId: number, 
    phoneNumbers: string[], 
    messageContent: string, 
    subject?: string
  ): Promise<Message> {
    console.log(`Sending direct message to ${phoneNumbers.length} recipients`);
    
    // 1. Validação dos números
    const validPhoneNumbers = phoneNumbers.filter(phone => {
      // Mínimo 10 dígitos (DDD + número sem o país)
      return phone.replace(/\D/g, "").length >= 10;
    });
    
    if (validPhoneNumbers.length === 0) {
      throw new Error("Nenhum número de telefone válido fornecido");
    }
    
    console.log(`Found ${validPhoneNumbers.length} valid phone numbers`);
    
    // 2. Criar entrada da mensagem
    const messageData: InsertMessage = {
      userId,
      content: messageContent,
      subject: subject || "Mensagem direta",
      status: "pending", // Inicialmente pendente até confirmação de envio
      sentAt: new Date()
    };

    console.log("Creating message record");
    const newMessage = await this.createMessage(messageData);
    console.log(`Created message with ID: ${newMessage.id}`);

    // 3. Adicionar destinatários
    const recipients: InsertMessageRecipient[] = validPhoneNumbers.map(phoneNumber => ({
      messageId: newMessage.id,
      phoneNumber: phoneNumber.replace(/\D/g, ""), // Normalizar para apenas dígitos
      type: 'phone',
      status: 'pending', // Inicialmente pendente
      sentAt: null // Será atualizado quando enviado
    }));

    console.log(`Adding ${recipients.length} recipients`);
    await this.addMessageRecipients(recipients);
    
    // 4. Atualizar status da mensagem (em uma implementação real, isso seria feito após confirmação de envio)
    // Este é apenas um placeholder para demonstrar o fluxo
    try {
      // No futuro, poderia ter um sistema de callback para atualizar o status quando o envio fosse confirmado
      console.log(`Message ${newMessage.id} ready for sending`);
    } catch (error) {
      console.error("Error during message preparation:", error);
      // Não propagar o erro, apenas registrar
    }

    return newMessage;
  }
}

// Exportar a instância
export const storage = new DatabaseStorage();