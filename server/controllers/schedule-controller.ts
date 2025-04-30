import { Request, Response } from 'express';
import { storage } from '../storage';

export async function getUpcomingSchedules(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 3;
    
    const schedules = await storage.getUpcomingSchedules(userId, limit);
    
    res.status(200).json(schedules);
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
    
    // Sort by scheduled date
    schedules.sort((a, b) => {
      const dateA = new Date(a.scheduledFor);
      const dateB = new Date(b.scheduledFor);
      return dateA.getTime() - dateB.getTime();
    });
    
    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      message: 'Failed to fetch schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
