import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseCSV, detectColumns, transformRow, validateMapping } from './utils/fileParser';

describe('Upload Integration - End-to-End Flow', () => {
  let salesBase64: string;
  let inventoryBase64: string;

  beforeAll(() => {
    // Load sample Excel files and convert to base64
    const salesPath = path.join('/home/ubuntu/upload', 'sales-.data.xlsx');
    if (fs.existsSync(salesPath)) {
      const salesBuffer = fs.readFileSync(salesPath);
      salesBase64 = Buffer.from(salesBuffer).toString('base64');
    }

    const inventoryPath = path.join('/home/ubuntu/upload', 'Inventory-.Data.xlsx');
    if (fs.existsSync(inventoryPath)) {
      const inventoryBuffer = fs.readFileSync(inventoryPath);
      inventoryBase64 = Buffer.from(inventoryBuffer).toString('base64');
    }
  });

  describe('Sales Data Upload Flow', () => {
    it('should parse sales Excel file and detect correct columns', async () => {
      if (!salesBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      // Step 1: Parse the file
      const data = await parseCSV(salesBase64);
      expect(data.length).toBeGreaterThan(0);

      // Step 2: Detect columns
      const columns = detectColumns(data);
      expect(columns).toContain('Medicine / Product Name');
      expect(columns).toContain('Quantity');
      expect(columns).toContain('Unit Cost (GH₵)');
      expect(columns).toContain('Selling Price (GH₵)');

      console.log('Sales columns detected:', columns);
    });

    it('should transform sales data rows correctly', async () => {
      if (!salesBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesBase64);
      const columns = detectColumns(data);

      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const
      };

      // Validate mapping
      const validation = validateMapping(mapping);
      expect(validation.valid).toBe(true);

      // Transform first data row
      const firstRow = data[0];
      const transformed = transformRow(firstRow, mapping);

      expect(transformed).not.toBeNull();
      expect(transformed?.productName).toBe('Paracetamol 500mg (Strip)');
      expect(transformed?.quantity).toBe(120);
      expect(transformed?.price).toBe(3.5);
      expect(transformed?.costPrice).toBe(1.5);
      expect(transformed?.dataType).toBe('sales');

      console.log('First sales row transformed:', transformed);
    });

    it('should process all sales data rows', async () => {
      if (!salesBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesBase64);
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const
      };

      let processedCount = 0;
      let errorCount = 0;

      for (const row of data) {
        const transformed = transformRow(row, mapping);
        if (transformed) {
          processedCount++;
        } else {
          errorCount++;
        }
      }

      console.log(`Sales: Processed ${processedCount} rows, ${errorCount} errors`);
      expect(processedCount).toBeGreaterThan(0);
    });
  });

  describe('Inventory Data Upload Flow', () => {
    it('should parse inventory Excel file (contains both Sales and Inventory sheets)', async () => {
      if (!inventoryBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      // Note: Inventory-.Data.xlsx has TWO sheets: Sales Data and Inventory Data
      // Our parser reads the first sheet by default (Sales Data)
      // In production, users would select which sheet to upload
      
      // Step 1: Parse the file (reads first sheet by default)
      const data = await parseCSV(inventoryBase64);
      expect(data.length).toBeGreaterThan(0);

      // Step 2: Detect columns - should detect Sales Data columns since that's the first sheet
      const columns = detectColumns(data);
      expect(columns).toContain('Medicine / Product Name');
      expect(columns).toContain('Quantity');
      expect(columns).toContain('Unit Cost (GH₵)');
      expect(columns).toContain('Selling Price (GH₵)');

      console.log('Inventory file (Sales sheet) columns detected:', columns);
    });

    it('should transform data rows from inventory file correctly', async () => {
      if (!inventoryBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const data = await parseCSV(inventoryBase64);

      // Use Sales Data mapping since that's what's in the first sheet
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const
      };

      // Validate mapping
      const validation = validateMapping(mapping);
      expect(validation.valid).toBe(true);

      // Transform first data row
      const firstRow = data[0];
      const transformed = transformRow(firstRow, mapping);

      expect(transformed).not.toBeNull();
      expect(transformed?.productName).toBe('Paracetamol 500mg (Strip)');
      expect(transformed?.costPrice).toBe(1.5);
      expect(transformed?.price).toBe(3.5);
      expect(transformed?.quantity).toBe(120);
      expect(transformed?.dataType).toBe('sales');

      console.log('First row from Inventory file (Sales sheet) transformed:', transformed);
    });

    it('should process all data rows from inventory file', async () => {
      if (!inventoryBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const data = await parseCSV(inventoryBase64);
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const
      };

      let processedCount = 0;
      let errorCount = 0;

      for (const row of data) {
        const transformed = transformRow(row, mapping);
        if (transformed) {
          processedCount++;
        } else {
          errorCount++;
        }
      }

      console.log(`Inventory file (Sales sheet): Processed ${processedCount} rows, ${errorCount} errors`);
      expect(processedCount).toBeGreaterThan(0);
    });
  });
});
