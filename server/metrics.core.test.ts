import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getDb } from './db';
import { inventory, salesTransactions, users } from '../drizzle/schema';
import { calculateDashboardMetrics } from './utils/analytics';
import { eq } from 'drizzle-orm';

describe('Core Performance Metrics - Total Revenue, Gross Profit, Dead Stock Value', () => {
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user with unique openId
    const testOpenId = `metrics-test-${Date.now()}`;
    await db.insert(users).values({
      openId: testOpenId,
      name: 'Metrics Test User',
      email: 'metrics@test.com',
      role: 'user',
      lastSignedIn: new Date(),
    });
    
    // Get the inserted user ID
    const insertedUsers = await db.select().from(users).where(eq(users.openId, testOpenId)).limit(1);
    if (insertedUsers.length === 0) throw new Error('Failed to create test user');
    testUserId = insertedUsers[0].id;
  });

  afterEach(async () => {
    if (!db) return;
    // Clean up test data
    await db.delete(salesTransactions).where(eq(salesTransactions.userId, testUserId));
    await db.delete(inventory).where(eq(inventory.userId, testUserId));
  });

  describe('Total Revenue Calculation', () => {
    it('should calculate total revenue as sum of all sales totalSaleValue', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create test inventory items
      await db.insert(inventory).values([
        {
          userId: testUserId,
          productName: 'Product A',
          quantity: 100,
          price: '50.00',
          costPrice: '30.00',
          lastSaleDate: new Date(),
        },
        {
          userId: testUserId,
          productName: 'Product B',
          quantity: 50,
          price: '100.00',
          costPrice: '60.00',
          lastSaleDate: new Date(),
        },
      ]);

      // Get the inventory IDs
      const inventoryItems = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      if (inventoryItems.length < 2) throw new Error('Failed to create inventory items');

      // Create sales transactions
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

      await db.insert(salesTransactions).values([
        {
          userId: testUserId,
          inventoryId: inventoryItems[0].id,
          productName: 'Product A',
          quantitySold: 10,
          salePrice: '50.00',
          totalSaleValue: '500.00',
          costPrice: '30.00',
          profit: '200.00',
          saleDate: fifteenDaysAgo,
        },
        {
          userId: testUserId,
          inventoryId: inventoryItems[1].id,
          productName: 'Product B',
          quantitySold: 5,
          salePrice: '100.00',
          totalSaleValue: '500.00',
          costPrice: '60.00',
          profit: '200.00',
          saleDate: fifteenDaysAgo,
        },
      ]);

      // Fetch data and calculate metrics
      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      // Total Revenue should be 500 + 500 = 1000
      expect(metrics.totalRevenue).toBe(1000);
    });

    it('should return 0 total revenue when no sales exist', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create inventory but no sales
      await db.insert(inventory).values({
        userId: testUserId,
        productName: 'Product A',
        quantity: 100,
        price: '50.00',
        costPrice: '30.00',
      });

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      expect(metrics.totalRevenue).toBe(0);
    });
  });

  describe('Gross Profit Calculation', () => {
    it('should calculate gross profit as sum of profit from sales', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create inventory
      await db.insert(inventory).values([
        {
          userId: testUserId,
          productName: 'Product A',
          quantity: 100,
          price: '50.00',
          costPrice: '30.00',
          lastSaleDate: new Date(),
        },
        {
          userId: testUserId,
          productName: 'Product B',
          quantity: 50,
          price: '100.00',
          costPrice: '60.00',
          lastSaleDate: new Date(),
        },
      ]);

      // Get the inventory IDs
      const inventoryItems = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      if (inventoryItems.length < 2) throw new Error('Failed to create inventory items');

      // Create sales transactions
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

      await db.insert(salesTransactions).values([
        {
          userId: testUserId,
          inventoryId: inventoryItems[0].id,
          productName: 'Product A',
          quantitySold: 10,
          salePrice: '50.00',
          totalSaleValue: '500.00',
          costPrice: '30.00',
          profit: '200.00',
          saleDate: fifteenDaysAgo,
        },
        {
          userId: testUserId,
          inventoryId: inventoryItems[1].id,
          productName: 'Product B',
          quantitySold: 5,
          salePrice: '100.00',
          totalSaleValue: '500.00',
          costPrice: '60.00',
          profit: '200.00',
          saleDate: fifteenDaysAgo,
        },
      ]);

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      // Gross Profit should be 200 + 200 = 400
      expect(metrics.estimatedProfit).toBe(400);
    });

    it('should return 0 profit when no sales exist', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create inventory but no sales
      await db.insert(inventory).values({
        userId: testUserId,
        productName: 'Product A',
        quantity: 100,
        price: '50.00',
        costPrice: '30.00',
      });

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      expect(metrics.estimatedProfit).toBe(0);
    });
  });

  describe('Dead Stock Value Calculation', () => {
    it('should calculate dead stock value for items with no sales in 60 days', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create inventory items with different last sale dates
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      await db.insert(inventory).values([
        {
          userId: testUserId,
          productName: 'Recent Product',
          quantity: 10,
          price: '100.00',
          costPrice: '60.00',
          lastSaleDate: fifteenDaysAgo,
        },
        {
          userId: testUserId,
          productName: 'Dead Stock Product',
          quantity: 20,
          price: '50.00',
          costPrice: '30.00',
          lastSaleDate: ninetyDaysAgo,
        },
      ]);

      // Create a sales transaction for the recent product (within 60 days)
      await db.insert(salesTransactions).values({
        userId: testUserId,
        inventoryId: 1,
        productName: 'Recent Product',
        quantitySold: 5,
        salePrice: '100.00',
        totalSaleValue: '500.00',
        costPrice: '60.00',
        profit: '200.00',
        saleDate: fifteenDaysAgo,
      });

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      // Dead stock value should be 50 * 20 = 1000 (only the dead stock product)
      expect(metrics.deadStockValue).toBe(1000);
    });

    it('should return 0 dead stock value when all items have recent sales', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create inventory items with recent sales
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

      // Create inventory
      const invResult = await db.insert(inventory).values([
        {
          userId: testUserId,
          productName: 'Product A',
          quantity: 10,
          price: '100.00',
          costPrice: '60.00',
          lastSaleDate: fifteenDaysAgo,
        },
        {
          userId: testUserId,
          productName: 'Product B',
          quantity: 20,
          price: '50.00',
          costPrice: '30.00',
          lastSaleDate: fifteenDaysAgo,
        },
      ]);

      // Create sales transactions for both products (recent sales)
      await db.insert(salesTransactions).values([
        {
          userId: testUserId,
          inventoryId: 1,
          productName: 'Product A',
          quantitySold: 5,
          salePrice: '100.00',
          totalSaleValue: '500.00',
          costPrice: '60.00',
          profit: '200.00',
          saleDate: fifteenDaysAgo,
        },
        {
          userId: testUserId,
          inventoryId: 2,
          productName: 'Product B',
          quantitySold: 10,
          salePrice: '50.00',
          totalSaleValue: '500.00',
          costPrice: '30.00',
          profit: '200.00',
          saleDate: fifteenDaysAgo,
        },
      ]);

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      expect(metrics.deadStockValue).toBe(0);
    });

    it('should include multiple dead stock items in the calculation', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create multiple dead stock items
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      await db.insert(inventory).values([
        {
          userId: testUserId,
          productName: 'Dead Stock 1',
          quantity: 10,
          price: '100.00',
          costPrice: '60.00',
          lastSaleDate: ninetyDaysAgo,
        },
        {
          userId: testUserId,
          productName: 'Dead Stock 2',
          quantity: 20,
          price: '50.00',
          costPrice: '30.00',
          lastSaleDate: ninetyDaysAgo,
        },
        {
          userId: testUserId,
          productName: 'Dead Stock 3',
          quantity: 5,
          price: '200.00',
          costPrice: '120.00',
          lastSaleDate: ninetyDaysAgo,
        },
      ]);

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      // Dead stock value = (100 * 10) + (50 * 20) + (200 * 5) = 1000 + 1000 + 1000 = 3000
      expect(metrics.deadStockValue).toBe(3000);
    });
  });

  describe('All Three Metrics Together', () => {
    it('should calculate all three metrics correctly in a realistic scenario', async () => {
      if (!db) throw new Error('Database not available');
      
      // Create a realistic inventory and sales scenario
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Create inventory
      await db.insert(inventory).values([
        {
          userId: testUserId,
          productName: 'Active Product',
          quantity: 50,
          price: '100.00',
          costPrice: '60.00',
          lastSaleDate: fifteenDaysAgo,
        },
        {
          userId: testUserId,
          productName: 'Dead Stock',
          quantity: 30,
          price: '75.00',
          costPrice: '45.00',
          lastSaleDate: ninetyDaysAgo,
        },
      ]);

      // Get the inventory IDs
      const inventoryItems = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      if (inventoryItems.length < 2) throw new Error('Failed to create inventory items');

      // Create sales transactions
      await db.insert(salesTransactions).values([
        {
          userId: testUserId,
          inventoryId: inventoryItems[0].id,
          productName: 'Active Product',
          quantitySold: 10,
          salePrice: '100.00',
          totalSaleValue: '1000.00',
          costPrice: '60.00',
          profit: '400.00',
          saleDate: fifteenDaysAgo,
        },
      ]);

      const inventoryData = await db.select().from(inventory).where(eq(inventory.userId, testUserId));
      const salesData = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));

      const metrics = calculateDashboardMetrics(inventoryData, salesData);

      // Verify all three metrics
      expect(metrics.totalRevenue).toBe(1000);
      expect(metrics.estimatedProfit).toBe(400);
      expect(metrics.deadStockValue).toBe(2250); // 75 * 30 from dead stock
    });
  });
});
