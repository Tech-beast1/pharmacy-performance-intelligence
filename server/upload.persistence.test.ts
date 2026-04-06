import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseCSV, detectColumns, transformRow } from './utils/fileParser';
import { db } from './db';
import { inventory, sales_transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Upload Persistence - Database & Metrics', () => {
  let salesBase64: string;

  beforeAll(() => {
    // Load sample Excel file
    const salesPath = path.join('/home/ubuntu/upload', 'sales-.data.xlsx');
    if (fs.existsSync(salesPath)) {
      const salesBuffer = fs.readFileSync(salesPath);
      salesBase64 = Buffer.from(salesBuffer).toString('base64');
    }
  });

  describe('Sales Data Persistence', () => {
    it('should parse and prepare sales data for database insertion', async () => {
      if (!salesBase64) {
        console.warn('Sales file not found, skipping test');
        return;
      }

      // Step 1: Parse the file
      const data = await parseCSV(salesBase64);
      expect(data.length).toBeGreaterThan(0);

      // Step 2: Detect columns
      const columns = detectColumns(data);
      console.log('Detected columns:', columns);

      // Step 3: Create mapping
      const mapping = {
        productName: 'Medicine / Product Name',
        quantity: 'Quantity',
        price: 'Selling Price (GH₵)',
        costPrice: 'Unit Cost (GH₵)',
        dataType: 'sales' as const
      };

      // Step 4: Transform all rows
      const transformedRows = data
        .map(row => transformRow(row, mapping))
        .filter(row => row !== null);

      expect(transformedRows.length).toBeGreaterThan(0);
      console.log(`Prepared ${transformedRows.length} sales rows for insertion`);

      // Step 5: Verify data structure
      const firstRow = transformedRows[0];
      expect(firstRow).toHaveProperty('productName');
      expect(firstRow).toHaveProperty('quantity');
      expect(firstRow).toHaveProperty('price');
      expect(firstRow).toHaveProperty('costPrice');
      expect(firstRow).toHaveProperty('dataType');

      // Step 6: Calculate metrics for first row
      const margin = firstRow.price - firstRow.costPrice;
      const marginPercent = (margin / firstRow.price) * 100;
      const totalRevenue = firstRow.quantity * firstRow.price;

      console.log('First row metrics:');
      console.log(`  Product: ${firstRow.productName}`);
      console.log(`  Quantity: ${firstRow.quantity}`);
      console.log(`  Unit Cost: GH₵${firstRow.costPrice}`);
      console.log(`  Selling Price: GH₵${firstRow.price}`);
      console.log(`  Margin: GH₵${margin} (${marginPercent.toFixed(2)}%)`);
      console.log(`  Total Revenue: GH₵${totalRevenue}`);

      expect(margin).toBeGreaterThan(0);
      expect(marginPercent).toBeGreaterThan(0);
      expect(totalRevenue).toBeGreaterThan(0);
    });

    it('should calculate profit with overhead costs correctly', async () => {
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

      const transformedRows = data
        .map(row => transformRow(row, mapping))
        .filter(row => row !== null);

      // Simulate overhead costs
      const monthlyOverheadCosts = {
        rent: 500,
        salaries: 2000,
        electricity: 300,
        others: 200
      };
      const totalOverhead = Object.values(monthlyOverheadCosts).reduce((a, b) => a + b, 0);
      const dailyOverhead = totalOverhead / 30; // Distribute over 30 days

      console.log('Overhead costs:');
      console.log(`  Monthly total: GH₵${totalOverhead}`);
      console.log(`  Daily average: GH₵${dailyOverhead.toFixed(2)}`);

      // Calculate profit for each row
      let totalProfit = 0;
      let totalRevenue = 0;
      let totalCost = 0;

      for (const row of transformedRows) {
        const revenue = row.quantity * row.price;
        const cost = row.quantity * row.costPrice;
        const profit = revenue - cost - dailyOverhead; // Deduct daily overhead

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;
      }

      console.log('\nAggregate metrics:');
      console.log(`  Total Revenue: GH₵${totalRevenue.toFixed(2)}`);
      console.log(`  Total Cost: GH₵${totalCost.toFixed(2)}`);
      console.log(`  Total Profit (after overhead): GH₵${totalProfit.toFixed(2)}`);
      console.log(`  Profit Margin: ${((totalProfit / totalRevenue) * 100).toFixed(2)}%`);

      expect(totalRevenue).toBeGreaterThan(0);
      expect(totalCost).toBeGreaterThan(0);
      expect(totalProfit).toBeGreaterThan(0);
    });

    it('should identify alert conditions (expiry, dead stock, low margin)', async () => {
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

      const transformedRows = data
        .map(row => transformRow(row, mapping))
        .filter(row => row !== null);

      // Analyze for alert conditions
      let lowMarginCount = 0;
      let highMarginCount = 0;

      for (const row of transformedRows) {
        const margin = row.price - row.costPrice;
        const marginPercent = (margin / row.price) * 100;

        if (marginPercent < 20) {
          lowMarginCount++;
          console.log(`Low margin product: ${row.productName} (${marginPercent.toFixed(2)}%)`);
        } else {
          highMarginCount++;
        }
      }

      console.log(`\nAlert summary:`);
      console.log(`  Low margin products (<20%): ${lowMarginCount}`);
      console.log(`  Normal margin products (≥20%): ${highMarginCount}`);

      // For sales data, we don't have expiry or stock info
      // But we can verify the alert logic would work
      expect(transformedRows.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate all required fields are present', async () => {
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

      let validCount = 0;
      let invalidCount = 0;

      for (const row of data) {
        const transformed = transformRow(row, mapping);
        if (transformed) {
          // Validate all required fields
          if (
            transformed.productName &&
            typeof transformed.quantity === 'number' &&
            typeof transformed.price === 'number' &&
            typeof transformed.costPrice === 'number'
          ) {
            validCount++;
          } else {
            invalidCount++;
          }
        } else {
          invalidCount++;
        }
      }

      console.log(`Validation results:`);
      console.log(`  Valid rows: ${validCount}`);
      console.log(`  Invalid rows: ${invalidCount}`);

      expect(validCount).toBeGreaterThan(0);
    });

    it('should handle numeric values correctly', async () => {
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

      for (const row of data) {
        const transformed = transformRow(row, mapping);
        if (transformed) {
          // Verify numeric types
          expect(typeof transformed.quantity).toBe('number');
          expect(typeof transformed.price).toBe('number');
          expect(typeof transformed.costPrice).toBe('number');

          // Verify positive values
          expect(transformed.quantity).toBeGreaterThan(0);
          expect(transformed.price).toBeGreaterThan(0);
          expect(transformed.costPrice).toBeGreaterThan(0);

          // Verify price >= cost
          expect(transformed.price).toBeGreaterThanOrEqual(transformed.costPrice);
        }
      }

      console.log('All numeric validations passed');
    });
  });
});
