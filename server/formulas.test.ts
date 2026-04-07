import { describe, it, expect } from 'vitest';
import {
  calculateTotalRevenue,
  calculateGrossProfit,
  calculateNetProfit,
  calculateExpiryRiskLoss,
  calculateDeadStockValue,
  calculateProfitMargin,
  calculateStockTurnoverRate,
} from './utils/formulas';
import type { SalesTransaction, Inventory } from '../drizzle/schema';

describe('Formula Calculations', () => {
  describe('calculateTotalRevenue', () => {
    it('should calculate total revenue correctly', () => {
      const transactions: SalesTransaction[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          quantitySold: 10,
          salePrice: 100,
          costPrice: 50,
          saleDate: new Date(),
          totalRevenue: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 'user1',
          productName: 'Medicine B',
          quantitySold: 5,
          salePrice: 200,
          costPrice: 100,
          saleDate: new Date(),
          totalRevenue: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateTotalRevenue(transactions);
      expect(result.value).toBe(2000); // (10 * 100) + (5 * 200)
      expect(result.interpretation).toContain('₵2,000');
      expect(result.recommendation).toContain('Monitor');
    });

    it('should handle empty transactions', () => {
      const result = calculateTotalRevenue([]);
      expect(result.value).toBe(0);
      expect(result.formatted).toBe('₵0.00');
      expect(result.recommendation).toContain('No sales');
    });
  });

  describe('calculateGrossProfit', () => {
    it('should calculate gross profit correctly', () => {
      const transactions: SalesTransaction[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          quantitySold: 10,
          salePrice: 100,
          costPrice: 50,
          saleDate: new Date(),
          totalRevenue: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateGrossProfit(transactions);
      expect(result.value).toBe(500); // (100 - 50) * 10
      expect(result.interpretation).toContain('gross profit');
      expect(result.recommendation).toContain('Review');
    });

    it('should handle negative profit (loss)', () => {
      const transactions: SalesTransaction[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          quantitySold: 10,
          salePrice: 50,
          costPrice: 100,
          saleDate: new Date(),
          totalRevenue: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateGrossProfit(transactions);
      expect(result.value).toBe(-500); // (50 - 100) * 10
      expect(result.recommendation).toContain('negative');
    });
  });

  describe('calculateNetProfit', () => {
    it('should calculate net profit correctly', () => {
      const result = calculateNetProfit(1000, 300);
      expect(result.value).toBe(700);
      expect(result.interpretation).toContain('₵700');
      expect(result.interpretation).toContain('operational costs');
      expect(result.recommendation).toContain('profitable');
    });

    it('should handle negative net profit', () => {
      const result = calculateNetProfit(500, 1000);
      expect(result.value).toBe(-500);
      expect(result.recommendation).toContain('negative');
    });
  });

  describe('calculateExpiryRiskLoss', () => {
    it('should calculate expiry risk for products expiring soon', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const inventory: Inventory[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          sku: 'MED-A',
          quantity: 10,
          price: 100,
          costPrice: 50,
          expiryDate,
          lastSaleDate: new Date(),
          totalSalesQuantity: 5,
          totalSalesValue: 500,
          qtySold30days: 2,
          qtySold60days: 4,
          qtySold90days: 6,
          qtySold120days: 8,
          stockValue: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateExpiryRiskLoss(inventory, 60);
      expect(result.value).toBe(500); // 50 * 10
      expect(result.interpretation).toContain('₵500');
      expect(result.interpretation).toContain('expiring');
      expect(result.recommendation).toContain('promotional');
    });

    it('should not include products already expired', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const inventory: Inventory[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          sku: 'MED-A',
          quantity: 10,
          price: 100,
          costPrice: 50,
          expiryDate,
          lastSaleDate: new Date(),
          totalSalesQuantity: 5,
          totalSalesValue: 500,
          qtySold30days: 2,
          qtySold60days: 4,
          qtySold90days: 6,
          qtySold120days: 8,
          stockValue: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateExpiryRiskLoss(inventory, 60);
      expect(result.value).toBe(0);
      expect(result.recommendation).toContain('No expiry');
    });
  });

  describe('calculateDeadStockValue', () => {
    it('should calculate dead stock value for products not sold', () => {
      const now = new Date();
      const lastSaleDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

      const inventory: Inventory[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          sku: 'MED-A',
          quantity: 10,
          price: 100,
          costPrice: 50,
          expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          lastSaleDate,
          totalSalesQuantity: 5,
          totalSalesValue: 500,
          qtySold30days: 0,
          qtySold60days: 0,
          qtySold90days: 0,
          qtySold120days: 5,
          stockValue: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateDeadStockValue(inventory, 60);
      expect(result.value).toBe(500); // 50 * 10
      expect(result.interpretation).toContain('₵500');
      expect(result.interpretation).toContain("haven't sold");
      expect(result.recommendation).toContain('discontinuing');
    });

    it('should not include recently sold products', () => {
      const now = new Date();
      const lastSaleDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const inventory: Inventory[] = [
        {
          id: '1',
          userId: 'user1',
          productName: 'Medicine A',
          sku: 'MED-A',
          quantity: 10,
          price: 100,
          costPrice: 50,
          expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          lastSaleDate,
          totalSalesQuantity: 5,
          totalSalesValue: 500,
          qtySold30days: 2,
          qtySold60days: 4,
          qtySold90days: 6,
          qtySold120days: 8,
          stockValue: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = calculateDeadStockValue(inventory, 60);
      expect(result.value).toBe(0);
      expect(result.recommendation).toContain('Excellent');
    });
  });

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      const result = calculateProfitMargin(1000, 300);
      expect(result.value).toBe(30); // (300 / 1000) * 100
      expect(result.formatted).toBe('30.0%');
    });

    it('should handle zero revenue', () => {
      const result = calculateProfitMargin(0, 0);
      expect(result.value).toBe(0);
    });

    it('should provide recommendations based on margin', () => {
      const highMargin = calculateProfitMargin(100, 40);
      expect(highMargin.recommendation).toContain('Strong');

      const lowMargin = calculateProfitMargin(100, 10);
      expect(lowMargin.recommendation).toContain('Low');
    });
  });

  describe('calculateStockTurnoverRate', () => {
    it('should calculate stock turnover rate correctly', () => {
      const result = calculateStockTurnoverRate(1000, 250);
      expect(result.value).toBe(4); // 1000 / 250
      expect(result.formatted).toBe('4.00x');
    });

    it('should handle zero average stock', () => {
      const result = calculateStockTurnoverRate(1000, 0);
      expect(result.value).toBe(0);
    });

    it('should provide recommendations based on turnover', () => {
      const highTurnover = calculateStockTurnoverRate(1000, 100);
      expect(highTurnover.recommendation).toContain('Excellent');

      const lowTurnover = calculateStockTurnoverRate(100, 100);
      expect(lowTurnover.recommendation).toContain('Slow');
    });
  });
});
