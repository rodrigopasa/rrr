import { Request, Response } from 'express';
import { storage } from '../storage';
import { parseCSV, parseExcel } from '../services/csv-parser';
import { InsertContact } from '@shared/schema';

export async function handleImportContacts(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { fileFormat, delimiter, groupName } = req.body;
    const userId = req.user!.id;
    let parsedContacts: { name: string; phone: string }[] = [];

    // Parse the file based on format
    if (fileFormat === 'csv') {
      parsedContacts = await parseCSV(req.file.buffer, delimiter);
    } else if (fileFormat === 'excel') {
      parsedContacts = await parseExcel(req.file.buffer);
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    if (parsedContacts.length === 0) {
      return res.status(400).json({ message: 'No contacts found in the file' });
    }

    let groupId: number | undefined;

    // Create a new group if groupName is provided
    if (groupName) {
      const group = await storage.createGroup({
        userId,
        name: groupName,
      });
      groupId = group.id;
    }

    // Transform parsed contacts to InsertContact format
    const contactsToInsert: InsertContact[] = parsedContacts.map((contact) => ({
      userId,
      name: contact.name,
      phone: contact.phone,
      groupId: groupId,
    }));

    // Insert contacts into storage
    await storage.createContacts(contactsToInsert);

    return res.status(200).json({
      message: 'Contacts imported successfully',
      imported: parsedContacts.length,
      group: groupName ? { id: groupId, name: groupName } : null,
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return res.status(500).json({
      message: 'Failed to import contacts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
