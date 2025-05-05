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
  
  // Garantir tempo mínimo de 30 segundos para evitar problemas
  const minDelay = 30 * 1000; // 30 segundos em milissegundos
  const actualDelay = Math.max(delay, minDelay);
  
  // Não permitir agendamento no passado
  if (delay < 0) {
    log(`Cannot schedule message ${message.id} in the past`, 'scheduler');
    return;
  }
  
  // Cálculo de minutos para log, usando o delay original para mensagem mais precisa
  const minutes = Math.round(delay / 1000 / 60);
  
  // Formatação de texto para log mais detalhado
  let timeDescription;
  if (minutes < 1) {
    timeDescription = `menos de 1 minuto`;
  } else if (minutes < 60) {
    timeDescription = `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    timeDescription = `${hours} hora${hours !== 1 ? 's' : ''}`;
    if (remainingMinutes > 0) {
      timeDescription += ` e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    }
  }
  
  log(`Scheduling message ${message.id} to be sent in ${timeDescription} (${scheduledTime.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})})`, 'scheduler');
  
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
      
      // Atualizar o status da mensagem para 'sent'
      try {
        await storage.updateMessageStatus(message.id, 'sent');
        log(`Updated message ${message.id} status to 'sent'`, 'scheduler');
      } catch (error) {
        log(`Error updating message status: ${error}`, 'scheduler');
      }
      
      // Clean up the scheduled task
      scheduledTasks.delete(message.id);
    } catch (error) {
      log(`Error sending scheduled message ${message.id}: ${error}`, 'scheduler');
    }
  }, actualDelay);
  
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
 * Load scheduled messages from storage on application startup
 */
export async function loadScheduledMessages(): Promise<void> {
  log('Loading scheduled messages from storage', 'scheduler');
  try {
    // Usar a interface de storage para obter as mensagens agendadas pendentes
    const userIds = await storage.getAllUserIds();
    let pendingMessagesCount = 0;
    
    // Para cada usuário, carregar suas mensagens agendadas
    for (const userId of userIds) {
      const schedules = await storage.getScheduledMessages(userId, { type: 'all', status: 'scheduled' });
      
      log(`Found ${schedules.length} pending scheduled messages for user ${userId}`, 'scheduler');
      pendingMessagesCount += schedules.length;
      
      // Para cada mensagem agendada
      for (const schedule of schedules) {
        const scheduledTime = new Date(schedule.scheduledAt || schedule.scheduledFor);
        
        // Verifique se a data de agendamento ainda está no futuro
        if (scheduledTime > new Date()) {
          log(`Loading scheduled message ${schedule.id} for ${scheduledTime.toLocaleString('pt-BR')}`, 'scheduler');
          
          // Formatar o array de destinatários 
          let recipients: string[] = [];
          if (schedule.recipients) {
            // Se já temos um array ou string com destinatários, usamos ele
            recipients = Array.isArray(schedule.recipients) 
              ? schedule.recipients 
              : typeof schedule.recipients === 'string' 
                ? schedule.recipients.split(',') 
                : [];
          } else if (schedule.recipientIds) {
            // Se temos IDs de destinatários, convertemos para um array
            recipients = Array.isArray(schedule.recipientIds)
              ? schedule.recipientIds
              : typeof schedule.recipientIds === 'string'
                ? schedule.recipientIds.split(',')
                : [];
          }
          
          // Verificar se é uma mensagem para grupos
          const isGroup = schedule.type === 'group' || 
                       schedule.subject?.toLowerCase().includes('grupo') || 
                       schedule.content?.toLowerCase().includes('grupo');
          
          // Reprogramar a mensagem
          scheduleMessage({
            id: schedule.id,
            userId: schedule.userId || userId,
            recipients: recipients,
            content: schedule.content,
            subject: schedule.subject,
            isGroup: isGroup
          }, scheduledTime);
        } else {
          // Se a mensagem já deveria ter sido enviada, atualizar status
          await storage.updateMessageStatus(schedule.id, 'expired');
          log(`Marked expired scheduled message ${schedule.id}`, 'scheduler');
        }
      }
    }
    
    log(`Total pending scheduled messages: ${pendingMessagesCount}`, 'scheduler');
  } catch (error) {
    log(`Error loading scheduled messages: ${error}`, 'scheduler');
  }
}
