import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics, identifyAlerts } from './utils/analytics';

describe('Duration-Based Dead Stock Calculations', () => {

  it('should identify dead stock products with 30-day duration', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Create inventory items
    const inventory = [
      {
        productName: 'Product A',
        quantity: 10,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: thirtyDaysAgo, // Sold 30 days ago - NOT dead stock for 30-day duration
      },
      {
        productName: 'Product B',
        quantity: 5,
        price: 50,
        costPrice: 25,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: sixtyDaysAgo, // Sold 60 days ago - IS dead stock for 30-day duration
      },
    ];

    // Calculate metrics with 30-day duration
    const metrics30 = calculateDashboardMetrics(inventory as any, [], undefined, undefined, 30);
    
    // Product B should be dead stock (sold 60 days ago, more than 30 days)
    expect(metrics30.deadStockValue).toBeGreaterThan(0);
  });

  it('should identify dead stock products with 60-day duration', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const inventory = [
      {
        productName: 'Product A',
        quantity: 10,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: thirtyDaysAgo, // Sold 30 days ago - NOT dead stock for 60-day duration
      },
      {
        productName: 'Product B',
        quantity: 5,
        price: 50,
        costPrice: 25,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: ninetyDaysAgo, // Sold 90 days ago - IS dead stock for 60-day duration
      },
    ];

    // Calculate metrics with 60-day duration
    const metrics60 = calculateDashboardMetrics(inventory as any, [], undefined, undefined, 60);
    
    // Product B should be dead stock (sold 90 days ago, more than 60 days)
    expect(metrics60.deadStockValue).toBeGreaterThan(0);
  });

  it('should calculate different dead stock values for different durations', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneHundredTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

    const inventory = [
      {
        productName: 'Product 30',
        quantity: 5,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: thirtyDaysAgo,
      },
      {
        productName: 'Product 60',
        quantity: 5,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: sixtyDaysAgo,
      },
      {
        productName: 'Product 90',
        quantity: 5,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: ninetyDaysAgo,
      },
      {
        productName: 'Product 120',
        quantity: 5,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: oneHundredTwentyDaysAgo,
      },
    ];

    // Calculate metrics with different durations
    const metrics30 = calculateDashboardMetrics(inventory as any, [], undefined, undefined, 30);
    const metrics60 = calculateDashboardMetrics(inventory as any, [], undefined, undefined, 60);
    const metrics90 = calculateDashboardMetrics(inventory as any, [], undefined, undefined, 90);
    const metrics120 = calculateDashboardMetrics(inventory as any, [], undefined, undefined, 120);

    // Dead stock value should DECREASE as duration increases (fewer products are considered dead stock)
    expect(metrics30.deadStockValue).toBeGreaterThanOrEqual(metrics60.deadStockValue);
    expect(metrics60.deadStockValue).toBeGreaterThanOrEqual(metrics90.deadStockValue);
    expect(metrics90.deadStockValue).toBeGreaterThanOrEqual(metrics120.deadStockValue);
  });

  it('should identify alerts with different durations', async () => {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const inventory = [
      {
        productName: 'Product A',
        quantity: 10,
        price: 100,
        costPrice: 50,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: sixtyDaysAgo,
      },
      {
        productName: 'Product B',
        quantity: 5,
        price: 50,
        costPrice: 25,
        expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        lastSaleDate: ninetyDaysAgo,
      },
    ];

    // Get alerts with 60-day duration
    const alerts60 = identifyAlerts(inventory as any, [], 60);
    
    // Get alerts with 120-day duration
    const alerts120 = identifyAlerts(inventory as any, [], 120);

    // 60-day duration should have more or equal dead stock products than 120-day
    expect(alerts60.deadStockProducts.length).toBeGreaterThanOrEqual(alerts120.deadStockProducts.length);
  });
});
