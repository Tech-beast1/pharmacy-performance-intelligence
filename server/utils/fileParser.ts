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
  qtySold90Days?: string; // Qty sold in 90 days (for inventory data)
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
  qtySold90Days?: number;
  sku?: string;
  saleQuantity?: number;
  saleDate?: Date;
  dataType?: 'sales' | 'inventory';
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
 * Parse CSV or Excel file content
 * @param fileContent - CSV text or base64-encoded Excel file
 */
export async function parseCSV(fileContent: string): Promise<any[]> {
  // Check if this is likely base64-encoded Excel (contains non-text characters when decoded)
  try {
    // Try to detect if it's base64 (Excel file)
    if (fileContent.length > 100 && !fileContent.includes('\n') && !fileContent.includes(',')) {
      // Likely base64-encoded Excel file
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Use xlsx to parse the Excel file
      const workbook = XLSX.read(bytes, { type: 'array' });
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
    }
  } catch (e) {
    // If base64 decode fails, treat as CSV
    console.error('Error parsing as Excel, falling back to CSV:', e);
  }
  
  // Parse as CSV
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: any) => {
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      },
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
 * Validate and transform parsed row according to column mapping
 */
export function transformRow(row: any, mapping: ColumnMapping): ParsedRow | null {
  try {
    const productName = row[mapping.productName]?.toString().trim();

    if (!productName) {
      return null;
    }

    const result: ParsedRow = {
      productName,
      dataType: mapping.dataType || 'sales',
    };

    // Handle Sales Data
    if (mapping.dataType === 'sales' || !mapping.dataType) {
      const priceStr = mapping.price ? row[mapping.price]?.toString().trim() : undefined;
      const quantityStr = mapping.quantity ? row[mapping.quantity]?.toString().trim() : undefined;

      if (!priceStr || !quantityStr) {
        return null;
      }

      const price = parseFloat(priceStr);
      const quantity = parseInt(quantityStr, 10);

      if (isNaN(price) || isNaN(quantity)) {
        return null;
      }

      result.price = price;
      result.quantity = quantity;

      if (mapping.costPrice && row[mapping.costPrice]) {
        result.costPrice = parseFloat(row[mapping.costPrice].toString());
      }
    }

    // Handle Inventory Data
    if (mapping.dataType === 'inventory') {
      if (mapping.costPrice && row[mapping.costPrice]) {
        result.costPrice = parseFloat(row[mapping.costPrice].toString());
      }

      if (mapping.sellingPrice && row[mapping.sellingPrice]) {
        result.sellingPrice = parseFloat(row[mapping.sellingPrice].toString());
      }

      if (mapping.stockOnHand && row[mapping.stockOnHand]) {
        result.stockOnHand = parseInt(row[mapping.stockOnHand].toString(), 10);
      }

      if (mapping.qtySold90Days && row[mapping.qtySold90Days]) {
        result.qtySold90Days = parseInt(row[mapping.qtySold90Days].toString(), 10);
      }

      if (mapping.expiryDate && row[mapping.expiryDate]) {
        const expiryDateStr = row[mapping.expiryDate].toString().trim();
        const expiryDate = new Date(expiryDateStr);
        if (!isNaN(expiryDate.getTime())) {
          result.expiryDate = expiryDate;
        }
      }
    }

    // Common fields
    if (mapping.sku && row[mapping.sku]) {
      result.sku = row[mapping.sku].toString().trim();
    }

    if (mapping.saleQuantity && row[mapping.saleQuantity]) {
      result.saleQuantity = parseInt(row[mapping.saleQuantity].toString(), 10);
    }

    if (mapping.saleDate && row[mapping.saleDate]) {
      const saleDate = new Date(row[mapping.saleDate].toString());
      if (!isNaN(saleDate.getTime())) {
        result.saleDate = saleDate;
      }
    }

    return result;
  } catch (error) {
    console.error('Error transforming row:', error);
    return null;
  }
}

/**
 * Validate column mapping has required fields
 */
export function validateMapping(mapping: ColumnMapping): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mapping.productName) errors.push('Product Name column is required');

  if (mapping.dataType === 'sales' || !mapping.dataType) {
    if (!mapping.price) errors.push('Price column is required for sales data');
    if (!mapping.quantity) errors.push('Quantity column is required for sales data');
  }

  if (mapping.dataType === 'inventory') {
    if (!mapping.costPrice) errors.push('Unit Cost column is required for inventory data');
    if (!mapping.sellingPrice) errors.push('Selling Price column is required for inventory data');
    if (!mapping.stockOnHand) errors.push('Stock on Hand column is required for inventory data');
    if (!mapping.expiryDate) errors.push('Expiry Date column is required for inventory data');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
