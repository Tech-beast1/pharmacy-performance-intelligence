import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics } from './utils/analytics';
import type { Inventory, SalesTransaction } from '../drizzle/schema';

describe('Dashboard Period Selector', () => {
  it('should calculate metrics for different periods with varying overhead costs', () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const inventory: Inventory[] = [];

    // Create sample sales transactions
    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Medicine A',
        quantitySold: 100,
        salePrice: 100,
        totalRevenue: 10000,
        costPrice: 30,
        profit: (100 - 30) * 100, // 7000
        saleDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        createdAt: now,
      },
    ];

    // Test with different overhead costs for different periods
    const lowOverhead = 1000; // 33.33 per day
    const highOverhead = 3000; // 100 per day

    const metricsLowOverhead = calculateDashboardMetrics(inventory, sales, undefined, lowOverhead);
    const metricsHighOverhead = calculateDashboardMetrics(inventory, sales, undefined, highOverhead);

    // Low overhead should result in higher profit
    expect(metricsLowOverhead.estimatedProfit).toBeGreaterThan(metricsHighOverhead.estimatedProfit);

    // Verify the difference is approximately the overhead difference
    const overheadDifference = highOverhead - lowOverhead;
    const profitDifference = metricsLowOverhead.estimatedProfit - metricsHighOverhead.estimatedProfit;
    
    // Allow some tolerance for rounding
    expect(Math.abs(profitDifference - overheadDifference)).toBeLessThan(10);
  });

  it('should handle period-specific overhead costs correctly', () => {
    const now = new Date();

    const inventory: Inventory[] = [];

    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Product A',
        quantitySold: 50,
        salePrice: 200,
        totalRevenue: 10000,
        costPrice: 100,
        profit: (200 - 100) * 50, // 5000
        saleDate: now,
        createdAt: now,
      },
    ];

    // January overhead: 3000
    const januaryMetrics = calculateDashboardMetrics(inventory, sales, undefined, 3000);

    // February overhead: 4000
    const februaryMetrics = calculateDashboardMetrics(inventory, sales, undefined, 4000);

    // March overhead: 2000
    const marchMetrics = calculateDashboardMetrics(inventory, sales, undefined, 2000);

    // Verify different overhead costs produce different profits
    expect(januaryMetrics.estimatedProfit).not.toBe(februaryMetrics.estimatedProfit);
    expect(februaryMetrics.estimatedProfit).not.toBe(marchMetrics.estimatedProfit);

    // Verify the relationship: more overhead = less profit
    expect(februaryMetrics.estimatedProfit).toBeLessThan(januaryMetrics.estimatedProfit);
    expect(januaryMetrics.estimatedProfit).toBeLessThan(marchMetrics.estimatedProfit);
  });

  it('should calculate correct profit for selected period with no overhead', () => {
    const now = new Date();

    const inventory: Inventory[] = [];

    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Product B',
        quantitySold: 30,
        salePrice: 150,
        totalRevenue: 4500,
        costPrice: 50,
        profit: (150 - 50) * 30, // 3000
        saleDate: now,
        createdAt: now,
      },
    ];

    // No overhead for this period
    const metrics = calculateDashboardMetrics(inventory, sales, undefined, 0);

    // Expected profit = 3000
    expect(metrics.estimatedProfit).toBe(3000);
  });

  it('should apply period-specific overhead to total profit correctly', () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const inventory: Inventory[] = [];

    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Medicine X',
        quantitySold: 200,
        salePrice: 50,
        totalRevenue: 10000,
        costPrice: 20,
        profit: (50 - 20) * 200, // 6000
        saleDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        createdAt: now,
      },
      {
        id: 2,
        userId: 1,
        inventoryId: 1,
        productName: 'Medicine Y',
        quantitySold: 100,
        salePrice: 75,
        totalRevenue: 7500,
        costPrice: 25,
        profit: (75 - 25) * 100, // 5000
        saleDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        createdAt: now,
      },
    ];

    // Monthly overhead: 3000 (100 per day)
    const monthlyOverhead = 3000;
    const metrics = calculateDashboardMetrics(inventory, sales, undefined, monthlyOverhead);

    // Total gross profit = 6000 + 5000 = 11000
    // Daily overhead = 3000 / 30 = 100
    // Period overhead (30 days) = 100 * 30 = 3000
    // Net profit = 11000 - 3000 = 8000
    expect(metrics.estimatedProfit).toBe(8000);
  });
});
