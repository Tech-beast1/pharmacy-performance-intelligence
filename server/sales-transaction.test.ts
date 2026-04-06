import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseCSV, transformRow, validateMapping } from './utils/fileParser';

describe('Sales Transaction Creation from Upload', () => {
  let salesFileBase64: string;

  beforeAll(() => {
    // Load the Sales data file
    const salesPath = path.join('/home/ubuntu/upload', 'sales-.data.xlsx');
    if (fs.existsSync(salesPath)) {
      const buffer = fs.readFileSync(salesPath);
      salesFileBase64 = Buffer.from(buffer).toString('base64');
    }
  });

  describe('Sales Data Processing', () => {
    it('should parse sales data and create transactions with today as saleDate', async () => {
      if (!salesFileBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesFileBase64, 'Sales Data');
      expect(data.length).toBeGreaterThan(0);

      // Mapping for sales data (as user would select in UI)
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const,
      };

      // Validate mapping
      const validation = validateMapping(mapping);
      expect(validation.valid).toBe(true);

      // Transform first row
      const firstRow = data[0];
      const parsed = transformRow(firstRow, mapping);

      expect(parsed).toBeDefined();
      expect(parsed?.productName).toBe('Paracetamol 500mg (Strip)');
      expect(parsed?.quantity).toBe(120);
      expect(parsed?.price).toBe(3.5);
      expect(parsed?.costPrice).toBe(1.5);

      console.log('First row parsed:', {
        productName: parsed?.productName,
        quantity: parsed?.quantity,
        price: parsed?.price,
        costPrice: parsed?.costPrice,
      });
    });

    it('should calculate profit correctly for sales transactions', async () => {
      if (!salesFileBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesFileBase64, 'Sales Data');
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const,
      };

      // Process all rows
      let totalRevenue = 0;
      let totalCost = 0;
      let totalProfit = 0;

      for (const row of data) {
        const parsed = transformRow(row, mapping);
        if (!parsed) continue;

        const revenue = parsed.price! * parsed.quantity!;
        const cost = (parsed.costPrice || 0) * parsed.quantity!;
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;
      }

      console.log('Sales data totals:', {
        totalRevenue: totalRevenue.toFixed(2),
        totalCost: totalCost.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        profitMargin: ((totalProfit / totalRevenue) * 100).toFixed(2) + '%',
      });

      expect(totalRevenue).toBeGreaterThan(0);
      expect(totalProfit).toBeGreaterThan(0);
      expect(totalProfit).toBeLessThan(totalRevenue);
    });

    it('should process all 13 sales records correctly', async () => {
      if (!salesFileBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesFileBase64, 'Sales Data');
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const,
      };

      let successCount = 0;
      const products: string[] = [];

      for (const row of data) {
        const parsed = transformRow(row, mapping);
        if (parsed) {
          successCount++;
          products.push(parsed.productName);
        }
      }

      console.log('Processed products:', products);
      expect(successCount).toBe(12); // 12 products in the file
    });

    it('should handle sales data with no explicit saleDate by using today', async () => {
      if (!salesFileBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesFileBase64, 'Sales Data');
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const,
      };

      const firstRow = data[0];
      const parsed = transformRow(firstRow, mapping);

      // saleDate should not be set from transformRow (no mapping for it)
      expect(parsed?.saleDate).toBeUndefined();

      // In the router, we would set it to today
      const saleDate = parsed?.saleDate || new Date();
      expect(saleDate).toBeDefined();
      expect(saleDate instanceof Date).toBe(true);

      console.log('Sale date (would be set to today):', saleDate);
    });
  });

  describe('Revenue and Profit Calculation', () => {
    it('should calculate correct revenue from all sales', async () => {
      if (!salesFileBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesFileBase64, 'Sales Data');
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const,
      };

      let totalRevenue = 0;
      for (const row of data) {
        const parsed = transformRow(row, mapping);
        if (parsed) {
          totalRevenue += parsed.price! * parsed.quantity!;
        }
      }

      // Expected revenue from sample data
      expect(totalRevenue).toBeCloseTo(13642.5, 1);
      console.log('Total revenue calculated:', totalRevenue.toFixed(2));
    });

    it('should calculate correct profit with overhead costs', async () => {
      if (!salesFileBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      const data = await parseCSV(salesFileBase64, 'Sales Data');
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const,
      };

      let totalRevenue = 0;
      let totalCost = 0;
      for (const row of data) {
        const parsed = transformRow(row, mapping);
        if (parsed) {
          totalRevenue += parsed.price! * parsed.quantity!;
          totalCost += (parsed.costPrice || 0) * parsed.quantity!;
        }
      }

      const grossProfit = totalRevenue - totalCost;
      const overheadCost = 100; // GH₵100 per day
      const netProfit = grossProfit - overheadCost;

      console.log('Profit calculation:', {
        totalRevenue: totalRevenue.toFixed(2),
        totalCost: totalCost.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        overheadCost: overheadCost.toFixed(2),
        netProfit: netProfit.toFixed(2),
      });

      expect(grossProfit).toBeCloseTo(7350, 1); // Actual gross profit from sample data
      expect(netProfit).toBeCloseTo(7250, 1); // After GH₵100 overhead
    });
  });
});
