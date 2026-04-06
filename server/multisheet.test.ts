import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getExcelSheets, parseExcelSheet } from './utils/fileParser';

describe('Multi-Sheet Excel Support', () => {
  let inventoryFileBase64: string;

  beforeAll(() => {
    // Load the Inventory-.Data.xlsx file which contains both Sales and Inventory sheets
    const inventoryPath = path.join('/home/ubuntu/upload', 'Inventory-.Data.xlsx');
    if (fs.existsSync(inventoryPath)) {
      const buffer = fs.readFileSync(inventoryPath);
      inventoryFileBase64 = Buffer.from(buffer).toString('base64');
    }
  });

  describe('getExcelSheets', () => {
    it('should detect all sheets in Excel file', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const sheets = await getExcelSheets(inventoryFileBase64);
      
      expect(sheets.length).toBeGreaterThan(1);
      console.log('Detected sheets:', sheets.map(s => ({ name: s.name, dataType: s.dataType })));
    });

    it('should identify Sales Data sheet with correct columns', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const sheets = await getExcelSheets(inventoryFileBase64);
      const salesSheet = sheets.find(s => s.name === 'Sales Data');
      
      expect(salesSheet).toBeDefined();
      expect(salesSheet?.dataType).toBe('sales');
      expect(salesSheet?.columns).toContain('Medicine / Product Name');
      expect(salesSheet?.columns).toContain('Quantity');
      expect(salesSheet?.columns).toContain('Unit Cost (GH₵)');
      expect(salesSheet?.columns).toContain('Selling Price (GH₵)');
      
      console.log('Sales Data sheet columns:', salesSheet?.columns);
    });

    it('should identify Inventory Data sheet with correct columns', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const sheets = await getExcelSheets(inventoryFileBase64);
      const inventorySheet = sheets.find(s => s.name === 'Inventory Data');
      
      expect(inventorySheet).toBeDefined();
      expect(inventorySheet?.dataType).toBe('inventory');
      expect(inventorySheet?.columns).toContain('Medicine / Product Name');
      expect(inventorySheet?.columns).toContain('Unit Cost (GH₵)');
      expect(inventorySheet?.columns).toContain('Selling Price (GH₵)');
      expect(inventorySheet?.columns).toContain('Stock on Hand');
      expect(inventorySheet?.columns).toContain('Expiry Date');
      expect(inventorySheet?.columns).toContain('Qty Sold (90 Days)');
      
      console.log('Inventory Data sheet columns:', inventorySheet?.columns);
    });
  });

  describe('parseExcelSheet', () => {
    it('should parse Sales Data sheet correctly', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const data = await parseExcelSheet(inventoryFileBase64, 'Sales Data');
      
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('Medicine / Product Name');
      expect(data[0]).toHaveProperty('Quantity');
      expect(data[0]).toHaveProperty('Unit Cost (GH₵)');
      expect(data[0]).toHaveProperty('Selling Price (GH₵)');
      
      console.log('Sales Data first row:', {
        product: data[0]['Medicine / Product Name'],
        quantity: data[0]['Quantity'],
        unitCost: data[0]['Unit Cost (GH₵)'],
        sellingPrice: data[0]['Selling Price (GH₵)']
      });
    });

    it('should parse Inventory Data sheet correctly', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const data = await parseExcelSheet(inventoryFileBase64, 'Inventory Data');
      
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('Medicine / Product Name');
      expect(data[0]).toHaveProperty('Unit Cost (GH₵)');
      expect(data[0]).toHaveProperty('Selling Price (GH₵)');
      expect(data[0]).toHaveProperty('Stock on Hand');
      expect(data[0]).toHaveProperty('Expiry Date');
      expect(data[0]).toHaveProperty('Qty Sold (90 Days)');
      
      console.log('Inventory Data first row:', {
        product: data[0]['Medicine / Product Name'],
        unitCost: data[0]['Unit Cost (GH₵)'],
        sellingPrice: data[0]['Selling Price (GH₵)'],
        stockOnHand: data[0]['Stock on Hand'],
        expiryDate: data[0]['Expiry Date'],
        qtySold90Days: data[0]['Qty Sold (90 Days)']
      });
    });

    it('should parse correct number of rows from each sheet', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const salesData = await parseExcelSheet(inventoryFileBase64, 'Sales Data');
      const inventoryData = await parseExcelSheet(inventoryFileBase64, 'Inventory Data');
      
      console.log(`Sales Data rows: ${salesData.length}`);
      console.log(`Inventory Data rows: ${inventoryData.length}`);
      
      expect(salesData.length).toBeGreaterThan(0);
      expect(inventoryData.length).toBeGreaterThan(0);
    });
  });

  describe('Sheet Detection Logic', () => {
    it('should correctly identify data type as inventory for Inventory Data sheet', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const sheets = await getExcelSheets(inventoryFileBase64);
      const inventorySheet = sheets.find(s => s.name === 'Inventory Data');
      
      expect(inventorySheet?.dataType).toBe('inventory');
      
      // Verify all inventory-specific columns are present
      const hasInventoryColumns = 
        inventorySheet?.columns.some(c => c.includes('Stock')) &&
        inventorySheet?.columns.some(c => c.includes('Expiry')) &&
        inventorySheet?.columns.some(c => c.includes('Qty Sold'));
      
      expect(hasInventoryColumns).toBe(true);
    });

    it('should correctly identify data type as sales for Sales Data sheet', async () => {
      if (!inventoryFileBase64) {
        console.warn('Inventory file not found, skipping test');
        return;
      }

      const sheets = await getExcelSheets(inventoryFileBase64);
      const salesSheet = sheets.find(s => s.name === 'Sales Data');
      
      expect(salesSheet?.dataType).toBe('sales');
      
      // Verify all sales-specific columns are present
      const hasSalesColumns = 
        salesSheet?.columns.some(c => c.includes('Quantity')) &&
        salesSheet?.columns.some(c => c.includes('Unit Cost')) &&
        salesSheet?.columns.some(c => c.includes('Selling Price'));
      
      expect(hasSalesColumns).toBe(true);
    });
  });
});
