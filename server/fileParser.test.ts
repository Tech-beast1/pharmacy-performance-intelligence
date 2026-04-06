import { describe, it, expect, beforeAll } from 'vitest';
import { parseCSV, detectColumns, transformRow, validateMapping } from './utils/fileParser';
import * as fs from 'fs';
import * as path from 'path';

describe('File Parser - Excel & CSV Support', () => {
  let excelBase64: string;
  let csvContent: string;

  beforeAll(() => {
    // Load sample Excel file and convert to base64
    const excelPath = path.join('/home/ubuntu/upload', 'sales-.data.xlsx');
    if (fs.existsSync(excelPath)) {
      const excelBuffer = fs.readFileSync(excelPath);
      excelBase64 = Buffer.from(excelBuffer).toString('base64');
    }

    // Load sample CSV content
    const csvPath = path.join('/home/ubuntu/upload', 'sample.csv');
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, 'utf-8');
    }
  });

  describe('parseCSV - Excel File Parsing', () => {
    it('should parse base64-encoded Excel file and extract columns', async () => {
      if (!excelBase64) {
        console.warn('Excel file not found, skipping test');
        return;
      }

      const data = await parseCSV(excelBase64);
      
      // Excel file should have data
      expect(data.length).toBeGreaterThan(0);
      
      // First row should contain column headers
      const firstRow = data[0];
      expect(firstRow).toBeDefined();
      
      // Check for expected column names (from Sales Data sheet)
      const columnNames = Object.keys(firstRow);
      expect(columnNames.length).toBeGreaterThan(0);
      
      console.log('Detected columns from Excel:', columnNames);
    });

    it('should detect columns from parsed Excel data', async () => {
      if (!excelBase64) {
        console.warn('Excel file not found, skipping test');
        return;
      }

      const data = await parseCSV(excelBase64);
      const columns = detectColumns(data);
      
      expect(columns.length).toBeGreaterThan(0);
      expect(Array.isArray(columns)).toBe(true);
      
      console.log('Detected columns:', columns);
    });
  });

  describe('detectColumns', () => {
    it('should extract column names from parsed data', () => {
      const mockData = [
        {
          'Medicine / Product Name': 'Paracetamol 500mg',
          'Quantity': '120',
          'Unit Cost (GH₵)': '1.5',
          'Selling Price (GH₵)': '3.5'
        }
      ];

      const columns = detectColumns(mockData);
      
      expect(columns).toContain('Medicine / Product Name');
      expect(columns).toContain('Quantity');
      expect(columns).toContain('Unit Cost (GH₵)');
      expect(columns).toContain('Selling Price (GH₵)');
    });

    it('should filter out empty column names', () => {
      const mockData = [
        {
          'Product': 'Item1',
          '': 'empty',
          '  ': 'whitespace'
        }
      ];

      const columns = detectColumns(mockData);
      
      expect(columns).toContain('Product');
      expect(columns.length).toBe(1);
    });
  });

  describe('transformRow', () => {
    it('should transform sales data row correctly', () => {
      const row = {
        'Medicine / Product Name': 'Paracetamol 500mg',
        'Quantity': '120',
        'Unit Cost (GH₵)': '1.5',
        'Selling Price (GH₵)': '3.5'
      };

      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const
      };

      const result = transformRow(row, mapping);
      
      expect(result).not.toBeNull();
      expect(result?.productName).toBe('Paracetamol 500mg');
      expect(result?.quantity).toBe(120);
      expect(result?.price).toBe(3.5);
      expect(result?.costPrice).toBe(1.5);
      expect(result?.dataType).toBe('sales');
    });

    it('should transform inventory data row correctly', () => {
      const row = {
        'Medicine / Product Name': 'Amoxicillin 250mg',
        'Unit Cost (GH₵)': '8',
        'Selling Price (GH₵)': '18',
        'Stock on Hand': '200',
        'Expiry Date': '2026-05-15',
        'Qty Sold (90 Days)': '160'
      };

      const mapping = {
        productName: 'Medicine / Product Name',
        costPrice: 'Unit Cost (GH₵)',
        sellingPrice: 'Selling Price (GH₵)',
        stockOnHand: 'Stock on Hand',
        expiryDate: 'Expiry Date',
        qtySold90Days: 'Qty Sold (90 Days)',
        dataType: 'inventory' as const
      };

      const result = transformRow(row, mapping);
      
      expect(result).not.toBeNull();
      expect(result?.productName).toBe('Amoxicillin 250mg');
      expect(result?.costPrice).toBe(8);
      expect(result?.sellingPrice).toBe(18);
      expect(result?.stockOnHand).toBe(200);
      expect(result?.qtySold90Days).toBe(160);
      expect(result?.expiryDate).toBeDefined();
      expect(result?.dataType).toBe('inventory');
    });
  });

  describe('validateMapping', () => {
    it('should validate sales data mapping', () => {
      const mapping = {
        productName: 'Product',
        quantity: 'Qty',
        price: 'Price',
        dataType: 'sales' as const
      };

      const validation = validateMapping(mapping);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should validate inventory data mapping', () => {
      const mapping = {
        productName: 'Product',
        costPrice: 'Cost',
        sellingPrice: 'Price',
        stockOnHand: 'Stock',
        expiryDate: 'Expiry',
        dataType: 'inventory' as const
      };

      const validation = validateMapping(mapping);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect missing required fields for sales data', () => {
      const mapping = {
        productName: 'Product',
        quantity: 'Qty',
        dataType: 'sales' as const
      };

      const validation = validateMapping(mapping);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Price is required for sales data');
    });

    it('should detect missing required fields for inventory data', () => {
      const mapping = {
        productName: 'Product',
        costPrice: 'Cost',
        dataType: 'inventory' as const
      };

      const validation = validateMapping(mapping);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
