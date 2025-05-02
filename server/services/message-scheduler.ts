import { whatsappClient } from '../whatsapp';
import { storage } from '../storage';
import { log } from '../vite';

type ScheduledMessage = {
  id: string;
  userId: number;
  recipients: string[];
  content: string;
  subject?: string;
  isGroup?: boolean; // Indica se os destinatários são grupos
};

// Map to store scheduled tasks
const scheduledTasks = new Map<string, NodeJS.Timeout>();

/**
 * Schedule a message to be sent at a specific time
 * Uses São Paulo timezone (UTC-3)
 */
export function scheduleMessage(message: ScheduledMessage, scheduledTime: Date): void {
  // Converter para timestamp considerando o fuso horário
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();
  
  // Permitir agendamento mesmo que seja para poucos minutos no futuro
  if (delay < 0) {
    log(`Cannot schedule message ${message.id} in the past`, 'scheduler');
    return;
  }
  
  const minutes = Math.round(delay / 1000 / 60);
  const timeDescription = minutes < 60 
    ? `${minutes} minuto${minutes !== 1 ? 's' : ''}` 
    : `${Math.round(minutes / 60)} hora${Math.round(minutes / 60) !== 1 ? 's' : ''} e ${minutes % 60} minuto${minutes % 60 !== 1 ? 's' : ''}`;
  
  log(`Scheduling message ${message.id} to be sent in ${timeDescription}`, 'scheduler');
  
  // Create a timeout to send the message
  const timeout = setTimeout(async () => {
    try {
      log(`Executing scheduled message ${message.id}`, 'scheduler');
      
      // Check if WhatsApp is connected
      const status = whatsappClient.getStatus();
      if (!status.isAuthenticated) {
        log(`WhatsApp not authenticated, cannot send scheduled message ${message.id}`, 'scheduler');
        return;
      }
      
      if (message.isGroup) {
        // Se for mensagem para grupos
        for (const groupId of message.recipients) {
          try {
            await whatsappClient.sendMessageToGroup(groupId, message.content);
            log(`Group message sent to ${groupId}`, 'scheduler');
            // Pequeno atraso entre mensagens para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            log(`Failed to send group message to ${groupId}: ${err}`, 'scheduler');
          }
        }
      } else {
        // Se for mensagem para contatos normais
        const result = await whatsappClient.sendBulkMessages(message);
        log(`Message ${message.id} sent to ${result.successful.length} recipients, failed for ${result.failed.length} recipients`, 'scheduler');
      }
      
      // Clean up the scheduled task
      scheduledTasks.delete(message.id);
    } catch (error) {
      log(`Error sending scheduled message ${message.id}: ${error}`, 'scheduler');
    }
  }, delay);
  
  // Store the timeout so it can be cancelled if needed
  scheduledTasks.set(message.id, timeout);
}

/**
 * Cancel a scheduled message
 */
export function cancelScheduledMessage(messageId: string): boolean {
  const timeout = scheduledTasks.get(messageId);
  if (timeout) {
    clearTimeout(timeout);
    scheduledTasks.delete(messageId);
    log(`Cancelled scheduled message ${messageId}`, 'scheduler');
    return true;
  }
  return false;
}

/**
 * Get all scheduled messages
 */
export function getScheduledMessages(): string[] {
  return Array.from(scheduledTasks.keys());
}

/**
 * Load scheduled messages from storage (would be used in a real app on startup)
 */
export async function loadScheduledMessages(): Promise<void> {
  log('Loading scheduled messages from storage', 'scheduler');
  try {
    // Em uma aplicação real, carregaríamos as mensagens agendadas do banco de dados
    // e reagendaríamos aquelas que ainda estão no futuro
    
    /* Exemplo de código para uma implementação real
    const pendingMessages = await storage.getPendingScheduledMessages();
    
    for (const message of pendingMessages) {
      if (message.scheduledAt > new Date()) {
        scheduleMessage({
          id: message.id,
          userId: message.userId,
          recipients: message.recipients,
          content: message.content,
          subject: message.subject,
          isGroup: message.isGroup
        }, message.scheduledAt);
      }
    }
    */
  } catch (error) {
    log(`Error loading scheduled messages: ${error}`, 'scheduler');
  }
}
