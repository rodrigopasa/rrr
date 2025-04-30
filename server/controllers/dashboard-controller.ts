import { Request, Response } from 'express';
import { storage } from '../storage';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    
    const stats = await storage.getDashboardStats(userId);
    
    // If the storage doesn't have any data yet, return some default values
    if (!stats) {
      return res.status(200).json({
        totalContacts: 0,
        messagesSent: 0,
        scheduledMessages: 0,
        deliveryRate: 0
      });
    }
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
