import { Request, Response } from 'express';
import { storage } from '../storage';
import { log } from '../vite';

// Interface que o frontend espera
interface FormattedSchedule {
  id: string;
  title: string;
  recipients: string;
  recipientCount: number;
  type: "individual" | "group" | "campaign" | "automation";
  scheduledFor: string;
}

/**
 * Formata as mensagens agendadas no formato esperado pelo frontend
 */
function formatScheduledMessages(schedules: any[]): FormattedSchedule[] {
  return schedules.map(schedule => {
    // Determinar o tipo de mensagem com base no conteúdo ou metadados
    let messageType: "individual" | "group" | "campaign" | "automation" = "individual";
    
    // Se o assunto contém "grupo", considera como mensagem de grupo
    if (schedule.subject?.toLowerCase().includes('grupo') || 
        schedule.content?.toLowerCase().includes('grupo')) {
      messageType = "group";
    }
    
    // Se o assunto contém "campanha", considera como campanha
    if (schedule.subject?.toLowerCase().includes('campanha')) {
      messageType = "campaign";
    }
    
    // Formata para o padrão esperado pelo frontend
    return {
      id: schedule.id,
      title: schedule.subject || "Mensagem Agendada",
      recipients: schedule.recipients || "Todos os contatos",
      recipientCount: schedule.recipientCount || 0,
      type: messageType,
      scheduledFor: schedule.scheduledAt || schedule.scheduledFor,
      content: schedule.content || "",
      status: schedule.status || "scheduled"
    };
  });
}

export async function getUpcomingSchedules(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 3;
    
    const schedules = await storage.getUpcomingSchedules(userId, limit);
    log(`Obtidas ${schedules.length} mensagens agendadas futuras`, 'schedule');
    
    // Formata no padrão esperado pelo frontend
    const formattedSchedules = formatScheduledMessages(schedules);
    
    res.status(200).json(formattedSchedules);
  } catch (error) {
    console.error('Error fetching upcoming schedules:', error);
    res.status(500).json({
      message: 'Failed to fetch upcoming schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getAllSchedules(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const search = req.query.search as string;
    const filter = req.query.filter as string;
    
    const schedules = await storage.getScheduledMessages(userId, { search, type: filter });
    log(`Obtidas ${schedules.length} mensagens agendadas totais`, 'schedule');
    
    // Debug para entender o que está sendo retornado
    log(`Exemplo de mensagem agendada: ${JSON.stringify(schedules[0] || {})}`, 'schedule');
    
    // Formata no padrão esperado pelo frontend
    const formattedSchedules = formatScheduledMessages(schedules);
    
    // Sort by scheduled date
    formattedSchedules.sort((a, b) => {
      const dateA = new Date(a.scheduledFor);
      const dateB = new Date(b.scheduledFor);
      return dateA.getTime() - dateB.getTime();
    });
    
    res.status(200).json(formattedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      message: 'Failed to fetch schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
