import Papa from 'papaparse';

export interface ColumnMapping {
  productName: string;
  price: string;
  quantity: string;
  expiryDate: string;
  costPrice?: string;
  sku?: string;
  saleQuantity?: string;
  saleDate?: string;
}

export interface ParsedRow {
  productName: string;
  price: number;
  quantity: number;
  expiryDate?: Date;
  costPrice?: number;
  sku?: string;
  saleQuantity?: number;
  saleDate?: Date;
}

/**
 * Detect available columns from CSV/Excel data
 */
export function detectColumns(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  const firstRow = data[0];
  return Object.keys(firstRow).filter(key => key && key.trim());
}

/**
 * Parse CSV file content
 */
export function parseCSV(fileContent: string): Promise<any[]> {
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
 * Parse Excel file (convert to CSV first)
 * Note: For production, use xlsx library
 */
export async function parseExcel(buffer: Buffer): Promise<any[]> {
  // For now, we'll handle this in the API route using xlsx
  throw new Error('Excel parsing should be handled via xlsx library in the API route');
}

/**
 * Validate and transform parsed row according to column mapping
 */
export function transformRow(row: any, mapping: ColumnMapping): ParsedRow | null {
  try {
    const productName = row[mapping.productName]?.toString().trim();
    const priceStr = row[mapping.price]?.toString().trim();
    const quantityStr = row[mapping.quantity]?.toString().trim();
    const expiryDateStr = row[mapping.expiryDate]?.toString().trim();

    if (!productName || !priceStr || !quantityStr) {
      return null;
    }

    const price = parseFloat(priceStr);
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(price) || isNaN(quantity)) {
      return null;
    }

    const result: ParsedRow = {
      productName,
      price,
      quantity,
    };

    if (mapping.costPrice && row[mapping.costPrice]) {
      result.costPrice = parseFloat(row[mapping.costPrice].toString());
    }

    if (mapping.sku && row[mapping.sku]) {
      result.sku = row[mapping.sku].toString().trim();
    }

    if (expiryDateStr) {
      const expiryDate = new Date(expiryDateStr);
      if (!isNaN(expiryDate.getTime())) {
        result.expiryDate = expiryDate;
      }
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
  if (!mapping.price) errors.push('Price column is required');
  if (!mapping.quantity) errors.push('Quantity column is required');
  if (!mapping.expiryDate) errors.push('Expiry Date column is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
