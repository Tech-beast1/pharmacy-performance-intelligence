import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ColumnMapping {
  productName: string;
  price?: string; // Selling price for sales data
  quantity?: string; // Quantity for sales data
  expiryDate?: string;
  costPrice?: string; // Unit cost
  sellingPrice?: string; // Selling cost (for inventory data)
  stockOnHand?: string; // Stock on hand (for inventory data)
  qtySold30Days?: string; // Qty sold in 30 days (for inventory data)
  qtySold60Days?: string; // Qty sold in 60 days (for inventory data)
  qtySold90Days?: string; // Qty sold in 90 days (for inventory data)
  qtySold120Days?: string; // Qty sold in 120 days (for inventory data)
  stockValue?: string; // Stock value (for inventory data)
  totalRevenue?: string; // Total revenue (for sales data)
  sku?: string;
  saleQuantity?: string;
  saleDate?: string;
  dataType?: 'sales' | 'inventory'; // Type of data being uploaded
}

export interface ParsedRow {
  productName: string;
  price?: number;
  quantity?: number;
  expiryDate?: Date;
  costPrice?: number;
  sellingPrice?: number;
  stockOnHand?: number;
  qtySold30Days?: number;
  qtySold60Days?: number;
  qtySold90Days?: number;
  qtySold120Days?: number;
  stockValue?: number;
  totalRevenue?: number;
  sku?: string;
  saleQuantity?: number;
  saleDate?: Date;
  dataType?: 'sales' | 'inventory';
}

export interface SheetInfo {
  name: string;
  columns: string[];
  dataType: 'sales' | 'inventory' | 'unknown';
}

/**
 * Detect available columns from CSV/Excel data
 */
export function detectColumns(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  const firstRow = data[0];
  return Object.keys(firstRow).filter(key => key && key.trim() && !key.startsWith('__EMPTY'));
}

/**
 * Detect data type based on column names
 */
function detectDataType(columns: string[]): 'sales' | 'inventory' | 'unknown' {
  const columnStr = columns.join(' ').toLowerCase();
  
  // Check for inventory-specific columns
  if (columnStr.includes('stock') || columnStr.includes('expiry') || columnStr.includes('qty sold')) {
    return 'inventory';
  }
  
  // Check for sales-specific columns
  if (columnStr.includes('quantity') || columnStr.includes('unit cost') || columnStr.includes('selling price')) {
    return 'sales';
  }
  
  return 'unknown';
}

/**
 * Get all sheets from Excel file with their columns
 */
export async function getExcelSheets(fileContent: string): Promise<SheetInfo[]> {
  try {
    // Decode base64
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheets: SheetInfo[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      // Find header row
      let headerRowIndex = 0;
      let dataStartIndex = 1;
      const commonHeaders = ['Medicine', 'Product', 'Quantity', 'Cost', 'Price', 'Stock', 'Expiry', 'Sold', 'Unit', 'Selling'];
      
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i] as any[];
        const rowStr = (row || []).join(' ').toLowerCase();
        if (commonHeaders.some(h => rowStr.includes(h.toLowerCase()))) {
          headerRowIndex = i;
          dataStartIndex = i + 1;
          break;
        }
      }

      const headers = (rawData[headerRowIndex] as any[]) || [];
      const columns = headers
        .filter((h: any) => h && h.toString().trim() && !h.toString().startsWith('__EMPTY'))
        .map((h: any) => h.toString().trim());

      const dataType = detectDataType(columns);

      sheets.push({
        name: sheetName,
        columns,
        dataType
      });
    }

    return sheets;
  } catch (error) {
    console.error('Error getting Excel sheets:', error);
    return [];
  }
}

/**
 * Parse specific sheet from Excel file
 */
export async function parseExcelSheet(fileContent: string, sheetName?: string): Promise<any[]> {
  try {
    // Decode base64
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const workbook = XLSX.read(bytes, { type: 'array' });
    
    // Use specified sheet or first sheet
    const targetSheet = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];

    if (!worksheet) {
      throw new Error(`Sheet "${targetSheet}" not found`);
    }

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Find the row with actual column headers (usually row 2 in pharmacy data)
    let headerRowIndex = 0;
    let dataStartIndex = 1;

    // Look for the header row by checking for common column names
    const commonHeaders = ['Medicine', 'Product', 'Quantity', 'Cost', 'Price', 'Stock', 'Expiry', 'Sold', 'Unit', 'Selling'];
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] as any[];
      const rowStr = (row || []).join(' ').toLowerCase();
      if (commonHeaders.some(h => rowStr.includes(h.toLowerCase()))) {
        headerRowIndex = i;
        dataStartIndex = i + 1;
        break;
      }
    }

    // Extract headers and data
    const headers = rawData[headerRowIndex] as any[];
    const dataRows = rawData.slice(dataStartIndex) as any[][];

    // Convert to array of objects
    const data = dataRows
      .filter((row: any[]) => row.some((cell: any) => cell !== '' && cell !== null && cell !== undefined))
      .map((row: any[]) => {
        const obj: any = {};
        (headers || []).forEach((header: any, index: number) => {
          if (header && header.toString().trim()) {
            obj[header.toString().trim()] = row[index] || '';
          }
        });
        return obj;
      });

    return data;
  } catch (e) {
    console.error('Error parsing Excel sheet:', e);
    throw e;
  }
}

/**
 * Parse CSV or Excel file content
 * @param fileContent - CSV text or base64-encoded Excel file
 * @param sheetName - Optional sheet name for Excel files
 */
export async function parseCSV(fileContent: string, sheetName?: string): Promise<any[]> {
  // Check if this is likely base64-encoded Excel (contains non-text characters when decoded)
  try {
    // Try to detect if it's base64 (Excel file)
    if (fileContent.length > 100 && !fileContent.includes('\n') && !fileContent.includes(',')) {
      // Likely base64-encoded Excel file
      return await parseExcelSheet(fileContent, sheetName);
    }
  } catch (e) {
    console.error('Error parsing as Excel, falling back to CSV:', e);
  }

  // Parse as CSV
  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        resolve(results.data || []);
      },
      error: () => {
        resolve([]);
      }
    });
  });
}

/**
 * Parse Excel file from buffer
 */
export async function parseExcel(buffer: Buffer): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get raw data to find where actual headers are
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Find the row with actual column headers (usually row 2 in pharmacy data)
    let headerRowIndex = 0;
    let dataStartIndex = 1;

    // Look for the header row by checking for common column names
    const commonHeaders = ['Medicine', 'Product', 'Quantity', 'Cost', 'Price', 'Stock', 'Expiry', 'Sold', 'Unit', 'Selling'];
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] as any[];
      const rowStr = (row || []).join(' ').toLowerCase();
      if (commonHeaders.some(h => rowStr.includes(h.toLowerCase()))) {
        headerRowIndex = i;
        dataStartIndex = i + 1;
        break;
      }
    }

    // Extract headers and data
    const headers = rawData[headerRowIndex] as any[];
    const dataRows = rawData.slice(dataStartIndex) as any[][];

    // Convert to array of objects
    const data = dataRows
      .filter((row: any[]) => row.some((cell: any) => cell !== '' && cell !== null && cell !== undefined))
      .map((row: any[]) => {
        const obj: any = {};
        (headers || []).forEach((header: any, index: number) => {
          if (header && header.toString().trim()) {
            obj[header.toString().trim()] = row[index] || '';
          }
        });
        return obj;
      });

    return data;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error}`);
  }
}

/**
 * Transform a row based on column mapping
 */
export function transformRow(row: any, mapping: ColumnMapping): ParsedRow | null {
  if (!row || !mapping.productName) return null;

  const productName = row[mapping.productName];
  if (!productName) return null;

  const result: ParsedRow = {
    productName: productName.toString().trim(),
    dataType: mapping.dataType
  };

  // Sales data fields
  if (mapping.quantity) {
    const qty = parseFloat(row[mapping.quantity]);
    if (!isNaN(qty)) result.quantity = qty;
  }

  if (mapping.price) {
    const price = parseFloat(row[mapping.price]);
    if (!isNaN(price)) result.price = price;
  }

  if (mapping.costPrice) {
    const cost = parseFloat(row[mapping.costPrice]);
    if (!isNaN(cost)) result.costPrice = cost;
  }

  // Inventory data fields
  if (mapping.sellingPrice) {
    const price = parseFloat(row[mapping.sellingPrice]);
    if (!isNaN(price)) result.sellingPrice = price;
  }

  if (mapping.stockOnHand) {
    const stock = parseFloat(row[mapping.stockOnHand]);
    if (!isNaN(stock)) result.stockOnHand = stock;
  }

  if (mapping.qtySold90Days) {
    const qty = parseFloat(row[mapping.qtySold90Days]);
    if (!isNaN(qty)) result.qtySold90Days = qty;
  }

  if (mapping.expiryDate) {
    const dateStr = row[mapping.expiryDate];
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) result.expiryDate = date;
    }
  }

  if (mapping.sku) {
    result.sku = row[mapping.sku]?.toString().trim();
  }

  if (mapping.saleQuantity) {
    const qty = parseFloat(row[mapping.saleQuantity]);
    if (!isNaN(qty)) result.saleQuantity = qty;
  }

  if (mapping.saleDate) {
    const dateStr = row[mapping.saleDate];
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) result.saleDate = date;
    }
  }

  return result;
}

/**
 * Validate column mapping
 */
export function validateMapping(mapping: ColumnMapping): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mapping.productName) {
    errors.push('Product Name mapping is required');
  }

  if (mapping.dataType === 'sales') {
    if (!mapping.quantity) errors.push('Quantity is required for sales data');
    if (!mapping.price) errors.push('Price is required for sales data');
  } else if (mapping.dataType === 'inventory') {
    if (!mapping.costPrice) errors.push('Cost Price is required for inventory data');
    if (!mapping.sellingPrice) errors.push('Selling Price is required for inventory data');
    if (!mapping.stockOnHand) errors.push('Stock on Hand is required for inventory data');
    if (!mapping.expiryDate) errors.push('Expiry Date is required for inventory data');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
