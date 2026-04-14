import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { upsertInventoryItem, getInventoryByUserId } from './db';

describe('Duplicate Inventory Prevention', () => {
  let db: any;
  const testUserId = 99999;
  const testSku = 'TEST-SKU-DUPLICATE-001';
  const testProductName = 'Test Product';

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      const { inventory } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      try {
        await db.delete(inventory).where(and(eq(inventory.userId, testUserId), eq(inventory.sku, testSku)));
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  });

  it('should update existing inventory item instead of creating duplicate when same SKU is uploaded twice', async () => {
    // First upload
    const firstItem = await upsertInventoryItem({
      userId: testUserId,
      productName: testProductName,
      sku: testSku,
      quantity: 100,
      price: 50,
      costPrice: 30,
      expiryDate: new Date('2027-06-30'),
      createdAt: new Date(),
    });

    // Get inventory after first upload
    const inventoryAfterFirst = await getInventoryByUserId(testUserId);
    const firstUploadCount = inventoryAfterFirst.filter((item: any) => item.sku === testSku).length;
    expect(firstUploadCount).toBe(1);

    // Second upload with same SKU but different quantity
    const secondItem = await upsertInventoryItem({
      userId: testUserId,
      productName: testProductName,
      sku: testSku,
      quantity: 200, // Different quantity
      price: 50,
      costPrice: 30,
      expiryDate: new Date('2027-07-15'), // Different expiry date
      createdAt: new Date(),
    });

    // Get inventory after second upload
    const inventoryAfterSecond = await getInventoryByUserId(testUserId);
    const secondUploadCount = inventoryAfterSecond.filter((item: any) => item.sku === testSku).length;

    // Should still have only 1 item (not 2)
    expect(secondUploadCount).toBe(1);

    // The item should have the updated quantity from the second upload
    const updatedItem = inventoryAfterSecond.find((item: any) => item.sku === testSku);
    expect(updatedItem).toBeDefined();
    expect(updatedItem?.quantity).toBe(200);
  });

  it('should create separate inventory items for different users with same SKU', async () => {
    const user1Id = 88888;
    const user2Id = 77777;
    const sharedSku = 'SHARED-SKU-001';

    try {
      // User 1 uploads
      await upsertInventoryItem({
        userId: user1Id,
        productName: 'Product A',
        sku: sharedSku,
        quantity: 100,
        price: 50,
        costPrice: 30,
        expiryDate: new Date('2027-06-30'),
        createdAt: new Date(),
      });

      // User 2 uploads same SKU
      await upsertInventoryItem({
        userId: user2Id,
        productName: 'Product A',
        sku: sharedSku,
        quantity: 200,
        price: 50,
        costPrice: 30,
        expiryDate: new Date('2027-06-30'),
        createdAt: new Date(),
      });

      // Get inventory for both users
      const user1Inventory = await getInventoryByUserId(user1Id);
      const user2Inventory = await getInventoryByUserId(user2Id);

      // Each user should have their own item
      const user1Item = user1Inventory.find((item: any) => item.sku === sharedSku);
      const user2Item = user2Inventory.find((item: any) => item.sku === sharedSku);

      expect(user1Item).toBeDefined();
      expect(user2Item).toBeDefined();
      expect(user1Item?.quantity).toBe(100);
      expect(user2Item?.quantity).toBe(200);

      // Clean up
      if (db) {
        const { inventory } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        await db.delete(inventory).where(and(eq(inventory.userId, user1Id), eq(inventory.sku, sharedSku)));
        await db.delete(inventory).where(and(eq(inventory.userId, user2Id), eq(inventory.sku, sharedSku)));
      }
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});
