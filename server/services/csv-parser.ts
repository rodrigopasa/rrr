import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// Function to parse CSV buffers
export async function parseCSV(
  buffer: Buffer,
  delimiter: string = 'comma'
): Promise<{ name: string; phone: string }[]> {
  // Map delimiter string to actual character
  const delimiterMap: Record<string, string> = {
    comma: ',',
    semicolon: ';',
    tab: '\t',
  };

  const delimiterChar = delimiterMap[delimiter] || ',';

  // Parse the CSV
  const records = csvParse(buffer, {
    delimiter: delimiterChar,
    columns: true,
    skip_empty_lines: true,
  });

  // Extract name and phone fields
  return records.map((record: any) => {
    // Try to find name and phone fields in the record
    // We'll look for common field names
    const nameField = findKey(record, ['name', 'nome', 'fullname', 'nome completo', 'contact', 'contato']);
    const phoneField = findKey(record, ['phone', 'telefone', 'celular', 'mobile', 'whatsapp', 'number', 'numero']);

    if (!nameField || !phoneField) {
      throw new Error('CSV headers not found or not recognized. Please use headers for name and phone columns.');
    }

    return {
      name: record[nameField],
      phone: formatPhoneNumber(record[phoneField]),
    };
  }).filter((contact: { name: string; phone: string }) => 
    contact.name && contact.phone
  );
}

// Function to parse Excel buffers
export async function parseExcel(
  buffer: Buffer
): Promise<{ name: string; phone: string }[]> {
  // Parse Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const records = XLSX.utils.sheet_to_json(worksheet);

  // Extract name and phone fields
  return records.map((record: any) => {
    // Try to find name and phone fields in the record
    const nameField = findKey(record, ['name', 'nome', 'fullname', 'nome completo', 'contact', 'contato']);
    const phoneField = findKey(record, ['phone', 'telefone', 'celular', 'mobile', 'whatsapp', 'number', 'numero']);

    if (!nameField || !phoneField) {
      throw new Error('Excel headers not found or not recognized. Please use headers for name and phone columns.');
    }

    return {
      name: record[nameField],
      phone: formatPhoneNumber(record[phoneField]),
    };
  }).filter((contact: { name: string; phone: string }) => 
    contact.name && contact.phone
  );
}

// Helper function to find a key in an object based on possible options
function findKey(obj: Record<string, any>, possibleKeys: string[]): string | null {
  for (const key of Object.keys(obj)) {
    if (possibleKeys.some(possibleKey => 
      key.toLowerCase() === possibleKey.toLowerCase() ||
      key.toLowerCase().includes(possibleKey.toLowerCase())
    )) {
      return key;
    }
  }
  return null;
}

// Helper function to format phone numbers
function formatPhoneNumber(phone: string): string {
  // Remove non-numeric characters
  const numericPhone = phone.replace(/\D/g, '');
  
  // Handle Brazilian phone numbers
  if (numericPhone.length === 11 || numericPhone.length === 10) {
    // Add Brazil country code if not present
    return numericPhone.startsWith('55') ? numericPhone : `55${numericPhone}`;
  }
  
  // Return original format if we can't determine the format
  return numericPhone;
}
