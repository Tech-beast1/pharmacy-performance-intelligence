import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users, salesTransactions, inventory, alerts, fileUploads, overheadCosts } from '../drizzle/schema';
import { clearAllUserData } from './db';
import { eq } from 'drizzle-orm';

describe('clearAllUserData', () => {
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user with unique openId
    const testOpenId = `test-user-${Date.now()}`;
    await db.insert(users).values({
      openId: testOpenId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      lastSignedIn: new Date(),
    });
    
    // Get the inserted user ID
    const insertedUsers = await db.select().from(users).where(eq(users.openId, testOpenId)).limit(1);
    if (insertedUsers.length === 0) throw new Error('Failed to create test user');
    testUserId = insertedUsers[0].id;
  });

  it('should delete all sales transactions for a user', async () => {
    if (!db) throw new Error('Database not available');

    // First create an inventory item (required for sales transactions)
    const inventoryResult = await db.insert(inventory).values({
      userId: testUserId,
      sku: `SKU-SALES-${Date.now()}`,
      productName: 'Product A',
      quantity: 10,
      price: '150.00',
      costPrice: '100.00',
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    // Get the inventory ID
    const inventoryItems = await db.select().from(inventory).where(eq(inventory.userId, testUserId)).limit(1);
    const inventoryId = inventoryItems[0].id;

    // Insert test sales transactions
    await db.insert(salesTransactions).values([
      {
        userId: testUserId,
        inventoryId: inventoryId,
        productName: 'Product A',
        quantitySold: 10,
        salePrice: 150.00,
        totalRevenue: 1500.00,
        costPrice: 100.00,
        profit: 500.00,
        saleDate: new Date(),
      },
      {
        userId: testUserId,
        inventoryId: inventoryId,
        productName: 'Product A',
        quantitySold: 5,
        salePrice: 150.00,
        totalRevenue: 750.00,
        costPrice: 100.00,
        profit: 250.00,
        saleDate: new Date(),
      },
    ]);

    // Verify transactions exist
    const transactionsBefore = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));
    expect(transactionsBefore.length).toBe(2);

    // Clear all data
    await clearAllUserData(testUserId2);

    // Verify transactions are deleted
    const transactionsAfter = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));
    expect(transactionsAfter.length).toBe(0);
  });

  it('should delete all inventory items for a user', async () => {
    // Create a new test user for this test to avoid conflicts
    const testOpenId2 = `test-user-inv-${Date.now()}`;
    await db.insert(users).values({
      openId: testOpenId2,
      name: 'Test User Inventory',
      email: 'test-inv@example.com',
      role: 'user',
      lastSignedIn: new Date(),
    });
    const insertedUsers2 = await db.select().from(users).where(eq(users.openId, testOpenId2)).limit(1);
    const testUserId2 = insertedUsers2[0].id;
    if (!db) throw new Error('Database not available');

    // Insert test inventory items
    await db.insert(inventory).values([
      {
        userId: testUserId2,
        sku: `SKU-INV-${Date.now()}-1`,
        productName: 'Medicine A',
        quantity: 50,
        price: '150.00',
        costPrice: '100.00',
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        userId: testUserId2,
        sku: `SKU-INV-${Date.now()}-2`,
        productName: 'Medicine B',
        quantity: 30,
        price: '300.00',
        costPrice: '200.00',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Verify inventory items exist
    const inventoryBefore = await db.select().from(inventory).where(eq(inventory.userId, testUserId2));
    expect(inventoryBefore.length).toBe(2);

    // Clear all data
    await clearAllUserData(testUserId2);

    // Verify inventory items are deleted
    const inventoryAfter = await db.select().from(inventory).where(eq(inventory.userId, testUserId2));
    expect(inventoryAfter.length).toBe(0);
  });

  it('should delete all alerts for a user', async () => {
    if (!db) throw new Error('Database not available');

    // First insert an inventory item (required for alerts)
    const inventoryResult = await db.insert(inventory).values({
      userId: testUserId,
      sku: `SKU-ALERT-${Date.now()}`,
      productName: 'Alert Test Product',
      quantity: 10,
      price: '150.00',
      costPrice: '100.00',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Get the inserted inventory ID
    const inventoryItems = await db.select().from(inventory).where(eq(inventory.userId, testUserId)).limit(1);
    const inventoryId = inventoryItems[0].id;

    // Insert test alerts
    await db.insert(alerts).values([
      {
        userId: testUserId,
        inventoryId: inventoryId,
        productName: 'Alert Test Product',
        alertType: 'expiry_risk',
        severity: 'warning',
        message: 'Product expiring soon',
      },
      {
        userId: testUserId,
        inventoryId: inventoryId,
        productName: 'Alert Test Product',
        alertType: 'dead_stock',
        severity: 'warning',
        message: 'No sales in 60 days',
      },
    ]);

    // Verify alerts exist
    const alertsBefore = await db.select().from(alerts).where(eq(alerts.userId, testUserId));
    expect(alertsBefore.length).toBe(2);

    // Clear all data
    await clearAllUserData(testUserId2);

    // Verify alerts are deleted
    const alertsAfter = await db.select().from(alerts).where(eq(alerts.userId, testUserId));
    expect(alertsAfter.length).toBe(0);
  });

  it('should delete all file uploads for a user', async () => {
    if (!db) throw new Error('Database not available');

    // Insert test file uploads
    await db.insert(fileUploads).values([
      {
        userId: testUserId,
        fileName: 'sales-data.xlsx',
        fileType: 'xlsx',
        status: 'completed',
        rowsProcessed: 100,
      },
      {
        userId: testUserId,
        fileName: 'inventory-data.csv',
        fileType: 'csv',
        status: 'completed',
        rowsProcessed: 50,
      },
    ]);

    // Verify file uploads exist
    const uploadsBefore = await db.select().from(fileUploads).where(eq(fileUploads.userId, testUserId));
    expect(uploadsBefore.length).toBe(2);

    // Clear all data
    await clearAllUserData(testUserId2);

    // Verify file uploads are deleted
    const uploadsAfter = await db.select().from(fileUploads).where(eq(fileUploads.userId, testUserId));
    expect(uploadsAfter.length).toBe(0);
  });

  it('should delete all overhead costs for a user', async () => {
    if (!db) throw new Error('Database not available');

    // Insert test overhead costs
    await db.insert(overheadCosts).values([
      {
        userId: testUserId,
        month: 1,
        year: 2025,
        rent: '5000.00',
        salaries: '10000.00',
        electricity: '1000.00',
        others: '500.00',
      },
      {
        userId: testUserId,
        month: 2,
        year: 2025,
        rent: '5000.00',
        salaries: '10000.00',
        electricity: '1200.00',
        others: '600.00',
      },
    ]);

    // Verify overhead costs exist
    const costsBefore = await db.select().from(overheadCosts).where(eq(overheadCosts.userId, testUserId));
    expect(costsBefore.length).toBe(2);

    // Clear all data
    await clearAllUserData(testUserId2);

    // Verify overhead costs are deleted
    const costsAfter = await db.select().from(overheadCosts).where(eq(overheadCosts.userId, testUserId));
    expect(costsAfter.length).toBe(0);
  });

  it('should not delete data for other users', async () => {
    if (!db) throw new Error('Database not available');

    // Create another test user
    const otherOpenId = `other-user-${Date.now()}`;
    await db.insert(users).values({
      openId: otherOpenId,
      name: 'Other User',
      email: 'other@example.com',
      role: 'user',
      lastSignedIn: new Date(),
    });

    const otherUsers = await db.select().from(users).where(eq(users.openId, otherOpenId)).limit(1);
    if (otherUsers.length === 0) throw new Error('Failed to create other test user');
    const otherUserId = otherUsers[0].id;

    // Create inventory items for both users
    const testInventory = await db.insert(inventory).values({
      userId: testUserId,
      sku: `SKU-TEST-${Date.now()}`,
      productName: 'Test Product',
      quantity: 10,
      price: '100.00',
      costPrice: '50.00',
    });

    const otherInventory = await db.insert(inventory).values({
      userId: otherUserId,
      sku: `SKU-OTHER-${Date.now()}`,
      productName: 'Other Product',
      quantity: 20,
      price: '200.00',
      costPrice: '100.00',
    });

    // Get inventory IDs
    const testInvItems = await db.select().from(inventory).where(eq(inventory.userId, testUserId)).limit(1);
    const otherInvItems = await db.select().from(inventory).where(eq(inventory.userId, otherUserId)).limit(1);
    const testInvId = testInvItems[0].id;
    const otherInvId = otherInvItems[0].id;

    // Insert sales transactions for both users
    await db.insert(salesTransactions).values([
      {
        userId: testUserId,
        inventoryId: testInvId,
        productName: 'Test Product',
        quantitySold: 5,
        salePrice: '100.00',
        totalRevenue: '500.00',
        costPrice: '50.00',
        profit: '250.00',
        saleDate: new Date(),
      },
      {
        userId: otherUserId,
        inventoryId: otherInvId,
        productName: 'Other Product',
        quantitySold: 10,
        salePrice: '200.00',
        totalRevenue: '2000.00',
        costPrice: '100.00',
        profit: '1000.00',
        saleDate: new Date(),
      },
    ]);

    // Clear data for test user
    await clearAllUserData(testUserId2);

    // Verify test user's data is deleted
    const testUserTransactions = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, testUserId));
    expect(testUserTransactions.length).toBe(0);

    // Verify other user's data is NOT deleted
    const otherUserTransactions = await db.select().from(salesTransactions).where(eq(salesTransactions.userId, otherUserId));
    expect(otherUserTransactions.length).toBe(1);
    expect(otherUserTransactions[0].productName).toBe('Other Product');

    // Clean up other user's data
    await clearAllUserData(otherUserId);
  });

  afterAll(async () => {
    if (!db) return;
    
    // Clean up test user and all their data
    try {
      await clearAllUserData(testUserId2);
      // Delete the test user
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });
});
