import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Contact schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  groupId: integer("group_id").references(() => contactGroups.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  userId: true,
  name: true,
  phone: true,
  groupId: true,
});

// Contact Group schema
export const contactGroups = pgTable("contact_groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactGroupSchema = createInsertSchema(contactGroups).pick({
  userId: true,
  name: true,
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject"),
  content: text("content").notNull(),
  isScheduled: boolean("is_scheduled").default(false),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("draft"), // draft, sent, delivered, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  subject: true,
  content: true,
  isScheduled: true,
  scheduledAt: true,
  status: true,
  sentAt: true,
});

// Message Recipient schema (for tracking recipients of each message)
export const messageRecipients = pgTable("message_recipients", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  contactId: integer("contact_id").references(() => contacts.id),
  phoneNumber: text("phone_number"), // Para números digitados diretamente
  type: text("type").notNull().default("contact"), // contact, phone, group
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageRecipientSchema = createInsertSchema(messageRecipients).pick({
  messageId: true,
  contactId: true,
  phoneNumber: true,
  type: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertContactGroup = z.infer<typeof insertContactGroupSchema>;
export type ContactGroup = typeof contactGroups.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertMessageRecipient = z.infer<typeof insertMessageRecipientSchema>;
export type MessageRecipient = typeof messageRecipients.$inferSelect;

// WhatsApp Groups schema
export const whatsappGroups = pgTable("whatsapp_groups", {
  id: text("id").primaryKey(), // ID do grupo do WhatsApp
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  isGroup: boolean("is_group").default(true),
  participantsCount: integer("participants_count"),
  timestamp: timestamp("timestamp").defaultNow(),
  unreadCount: integer("unread_count").default(0),
  isFavorite: boolean("is_favorite").default(false),
  lastMessageSent: text("last_message_sent"),
  metadata: json("metadata"), // Dados adicionais do grupo
  campaignStatus: text("campaign_status").default("none"), // none, active, pending, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWhatsappGroupSchema = createInsertSchema(whatsappGroups).pick({
  id: true,
  userId: true,
  name: true,
  isGroup: true,
  participantsCount: true,
  timestamp: true,
  unreadCount: true,
  isFavorite: true,
  lastMessageSent: true,
  metadata: true,
  campaignStatus: true,
});

// WhatsApp Contacts schema
export const whatsappContacts = pgTable("whatsapp_contacts", {
  id: text("id").primaryKey(), // ID do contato do WhatsApp
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  number: text("number").notNull(),
  profilePicUrl: text("profile_pic_url"),
  isMyContact: boolean("is_my_contact").default(false),
  isGroup: boolean("is_group").default(false),
  isFavorite: boolean("is_favorite").default(false),
  metadata: json("metadata"), // Dados adicionais do contato
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWhatsappContactSchema = createInsertSchema(whatsappContacts).pick({
  id: true,
  userId: true,
  name: true,
  number: true,
  profilePicUrl: true,
  isMyContact: true,
  isGroup: true,
  isFavorite: true,
  metadata: true,
});

// WhatsApp Status schema (para armazenar estado da conexão)
export const whatsappStatus = pgTable("whatsapp_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  isAuthenticated: boolean("is_authenticated").default(false),
  lastQrCode: text("last_qr_code"),
  lastAuthenticated: timestamp("last_authenticated"),
  deviceInfo: json("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWhatsappStatusSchema = createInsertSchema(whatsappStatus).pick({
  userId: true,
  isAuthenticated: true,
  lastQrCode: true,
  lastAuthenticated: true,
  deviceInfo: true,
});

// Types para WhatsApp
export type InsertWhatsappGroup = z.infer<typeof insertWhatsappGroupSchema>;
export type WhatsappGroup = typeof whatsappGroups.$inferSelect;

export type InsertWhatsappContact = z.infer<typeof insertWhatsappContactSchema>;
export type WhatsappContact = typeof whatsappContacts.$inferSelect;

export type InsertWhatsappStatus = z.infer<typeof insertWhatsappStatusSchema>;
export type WhatsappStatus = typeof whatsappStatus.$inferSelect;

// Campaigns schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, scheduled, active, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  messageTemplate: text("message_template").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  metadata: json("metadata"), // Dados adicionais da campanha
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  userId: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  messageTemplate: true,
  tags: true,
  metadata: true,
});

// Campaign Groups (relação entre campanhas e grupos)
export const campaignGroups = pgTable("campaign_groups", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  groupId: text("group_id").notNull().references(() => whatsappGroups.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignGroupSchema = createInsertSchema(campaignGroups).pick({
  campaignId: true,
  groupId: true,
});

// Campaign stats
export const campaignStats = pgTable("campaign_stats", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  messagesSent: integer("messages_sent").default(0),
  messagesDelivered: integer("messages_delivered").default(0),
  messagesRead: integer("messages_read").default(0),
  totalMessages: integer("total_messages").default(0),
  progress: integer("progress").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignStatsSchema = createInsertSchema(campaignStats).pick({
  campaignId: true,
  messagesSent: true,
  messagesDelivered: true,
  messagesRead: true,
  totalMessages: true,
  progress: true,
});

// Types para Campaigns
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertCampaignGroup = z.infer<typeof insertCampaignGroupSchema>;
export type CampaignGroup = typeof campaignGroups.$inferSelect;

export type InsertCampaignStats = z.infer<typeof insertCampaignStatsSchema>;
export type CampaignStats = typeof campaignStats.$inferSelect;
