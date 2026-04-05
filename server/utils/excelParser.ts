import * as XLSX from 'xlsx';

/**
 * Parse Excel file buffer and extract data with proper headers
 */
export function parseExcelBuffer(buffer: Buffer): { headers: string[]; data: any[]; sheetName: string } {
  try {
    // Read the workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON with headers from first row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
    }) as any[][];

    if (jsonData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // Find the header row (skip title rows if any)
    let headerRowIndex = 0;
    let headers: string[] = [];

    // Look for the row with actual column headers
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.length > 0) {
        // Check if this looks like a header row (contains text, not numbers)
        const hasText = row.some((cell: any) => 
          typeof cell === 'string' && cell.trim().length > 0 && isNaN(Number(cell))
        );
        
        if (hasText) {
          headers = row.map((cell: any) => String(cell).trim()).filter(h => h);
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headers.length === 0) {
      throw new Error('Could not find header row in Excel file');
    }

    // Extract data rows (skip header and any title rows)
    const dataRows: any[] = [];
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      // Check if row has any data
      const hasData = row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasData) continue;

      // Convert row array to object using headers
      const rowObj: any = {};
      headers.forEach((header, index) => {
        const value = row[index];
        rowObj[header] = value !== undefined ? value : '';
      });
      
      dataRows.push(rowObj);
    }

    return {
      headers,
      data: dataRows,
      sheetName,
    };
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw error;
  }
}

/**
 * Convert Excel buffer to CSV string
 */
export function excelToCSV(buffer: Buffer): string {
  try {
    const { headers, data } = parseExcelBuffer(buffer);
    
    // Create CSV header row
    const csvLines: string[] = [];
    csvLines.push(headers.map(h => `"${h}"`).join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const strValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quotes
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      });
      csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
  } catch (error) {
    console.error('Excel to CSV conversion error:', error);
    throw error;
  }
}
