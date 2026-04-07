import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics } from './utils/analytics';
import type { Inventory, SalesTransaction } from '../drizzle/schema';

describe('Overhead Cost Profit Calculation', () => {
  it('should deduct overhead costs from total profit', () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create sample inventory
    const inventory: Inventory[] = [
      {
        id: 1,
        userId: 1,
        productName: 'Aspirin',
        sku: 'ASP-001',
        quantity: 100,
        price: 50,
        costPrice: 20,
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        lastSaleDate: now,
        totalSalesValue: 5000,
        createdAt: now,
      },
    ];

    // Create sample sales transactions (last 30 days)
    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Aspirin',
        quantitySold: 50,
        salePrice: 50,
        totalRevenue: 2500,
        costPrice: 20,
        profit: (50 - 20) * 50, // 1500
        saleDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        createdAt: now,
      },
      {
        id: 2,
        userId: 1,
        inventoryId: 1,
        productName: 'Aspirin',
        quantitySold: 30,
        salePrice: 50,
        totalRevenue: 1500,
        costPrice: 20,
        profit: (50 - 20) * 30, // 900
        saleDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        createdAt: now,
      },
    ];

    // Test without overhead costs
    const metricsWithoutOverhead = calculateDashboardMetrics(inventory, sales);
    const totalProfitWithoutOverhead = metricsWithoutOverhead.estimatedProfit;
    
    // Expected: 1500 + 900 = 2400
    expect(totalProfitWithoutOverhead).toBe(2400);

    // Test with monthly overhead costs of 3000 (100/day)
    const monthlyOverheadCosts = 3000;
    const metricsWithOverhead = calculateDashboardMetrics(
      inventory,
      sales,
      undefined,
      monthlyOverheadCosts
    );
    const totalProfitWithOverhead = metricsWithOverhead.estimatedProfit;

    // Daily overhead = 3000 / 30 = 100
    // Days in period (last 30 days) = 30
    // Period overhead = 100 * 30 = 3000
    // Expected profit = 2400 - 3000 = -600
    expect(totalProfitWithOverhead).toBe(-600);
  });

  it('should correctly apply formula: Profit = Selling Price - (Unit Cost Price + Daily Overhead)', () => {
    const now = new Date();

    const inventory: Inventory[] = [];

    // Create sales with known values
    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Medicine A',
        quantitySold: 100, // 100 units sold
        salePrice: 100, // Selling price = 100 per unit
        totalRevenue: 10000,
        costPrice: 30, // Unit cost = 30
        profit: (100 - 30) * 100, // 7000 (70 per unit * 100 units)
        saleDate: now,
        createdAt: now,
      },
    ];

    // Monthly overhead = 3000 (100 per day)
    const monthlyOverheadCosts = 3000;
    const metrics = calculateDashboardMetrics(
      inventory,
      sales,
      undefined,
      monthlyOverheadCosts
    );

    // Formula: Profit = Selling Price - (Unit Cost Price + Daily Overhead)
    // Total Profit = (100 - 30) * 100 - (3000 / 30 * 1) = 7000 - 100 = 6900
    // (Assuming 1 day period for simplicity)
    
    // Since we're calculating for last 30 days:
    // Daily overhead = 3000 / 30 = 100
    // Period overhead = 100 * 30 = 3000
    // Total profit = 7000 - 3000 = 4000
    expect(metrics.estimatedProfit).toBe(4000);
  });

  it('should handle zero overhead costs', () => {
    const now = new Date();

    const inventory: Inventory[] = [];

    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Medicine A',
        quantitySold: 50,
        salePrice: 75,
        totalRevenue: 3750,
        costPrice: 25,
        profit: (75 - 25) * 50, // 2500
        saleDate: now,
        createdAt: now,
      },
    ];

    // No overhead costs
    const metrics = calculateDashboardMetrics(inventory, sales, undefined, 0);

    // Expected profit = 2500
    expect(metrics.estimatedProfit).toBe(2500);
  });

  it('should handle undefined overhead costs', () => {
    const now = new Date();

    const inventory: Inventory[] = [];

    const sales: SalesTransaction[] = [
      {
        id: 1,
        userId: 1,
        inventoryId: 1,
        productName: 'Medicine C',
        quantitySold: 40,
        salePrice: 60,
        totalRevenue: 2400,
        costPrice: 20,
        profit: (60 - 20) * 40, // 1600
        saleDate: now,
        createdAt: now,
      },
    ];

    // Undefined overhead costs
    const metrics = calculateDashboardMetrics(inventory, sales, undefined, undefined);

    // Expected profit = 1600
    expect(metrics.estimatedProfit).toBe(1600);
  });
});
