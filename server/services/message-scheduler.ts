import { whatsappClient } from '../whatsapp';
import { storage } from '../storage';
import { log } from '../vite';

type ScheduledMessage = {
  id: string;
  userId: number;
  recipients: string[];
  content: string;
  subject?: string;
};

// Map to store scheduled tasks
const scheduledTasks = new Map<string, NodeJS.Timeout>();

/**
 * Schedule a message to be sent at a specific time
 */
export function scheduleMessage(message: ScheduledMessage, scheduledTime: Date): void {
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();
  
  if (delay <= 0) {
    log(`Cannot schedule message ${message.id} in the past`, 'scheduler');
    return;
  }
  
  log(`Scheduling message ${message.id} to be sent in ${Math.round(delay / 1000 / 60)} minutes`, 'scheduler');
  
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
      
      // Send the message
      const result = await whatsappClient.sendBulkMessages(message);
      
      // Update message status in storage (would be done in a real app)
      log(`Message ${message.id} sent to ${result.successful.length} recipients, failed for ${result.failed.length} recipients`, 'scheduler');
      
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
 * Load scheduled messages from storage (would be used in a real app on startup)
 */
export async function loadScheduledMessages(): Promise<void> {
  log('Loading scheduled messages from storage', 'scheduler');
  // In a real app, we would load scheduled messages from storage here
  // For this demo, we'll just log that it's happening
}
