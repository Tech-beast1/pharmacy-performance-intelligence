import Papa from 'papaparse';

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
