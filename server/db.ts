import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, gte, lte } from "drizzle-orm";
import { InsertUser, users, inventory, salesTransactions, alerts, fileUploads, overheadCosts, pharmacyProfiles, monthlyMetrics, userPreferences } from "../drizzle/schema";
import { ENV } from './_core/env';

import type { Inventory, SalesTransaction, Alert, FileUpload, OverheadCost, InsertOverheadCost, PharmacyProfile, InsertPharmacyProfile, MonthlyMetric, InsertMonthlyMetric, UserPreference, InsertUserPreference } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Inventory queries
export async function getInventoryByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory).where(eq(inventory.userId, userId));
}

export async function upsertInventoryItem(item: any) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db
    .select()
    .from(inventory)
    .where(eq(inventory.sku, item.sku))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(inventory).set(item).where(eq(inventory.sku, item.sku));
    return existing[0];
  } else {
    const result = await db.insert(inventory).values(item);
    return result;
  }
}

// Sales transaction queries
export async function getSalesTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesTransactions).where(eq(salesTransactions.userId, userId));
}

export async function insertSalesTransaction(transaction: any) {
  const db = await getDb();
  if (!db) return null;
  return db.insert(salesTransactions).values(transaction);
}

// Update inventory lastSaleDate when a sale is recorded
export async function updateInventoryLastSaleDate(inventoryId: number, saleDate: Date) {
  const db = await getDb();
  if (!db) return null;
  return db.update(inventory).set({ lastSaleDate: saleDate }).where(eq(inventory.id, inventoryId));
}

// Alerts queries
export async function getAlertsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.userId, userId));
}

export async function upsertAlert(alert: any) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.userId, alert.userId),
        eq(alerts.inventoryId, alert.inventoryId),
        eq(alerts.alertType, alert.alertType)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(alerts).set(alert).where(eq(alerts.id, existing[0].id));
    return existing[0];
  } else {
    const result = await db.insert(alerts).values(alert);
    return result;
  }
}

// File upload tracking
export async function insertFileUpload(upload: any) {
  const db = await getDb();
  if (!db) return null;
  return db.insert(fileUploads).values(upload);
}

export async function updateFileUploadStatus(uploadId: number, status: string, rowsProcessed?: number) {
  const db = await getDb();
  if (!db) return null;
  const updates: any = { status };
  if (rowsProcessed !== undefined) updates.rowsProcessed = rowsProcessed;
  if (status === 'completed') updates.completedAt = new Date();
  return db.update(fileUploads).set(updates).where(eq(fileUploads.id, uploadId));
}


// Overhead costs queries
export async function getOverheadCostsByMonth(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(overheadCosts)
    .where(
      and(
        eq(overheadCosts.userId, userId),
        eq(overheadCosts.month, month),
        eq(overheadCosts.year, year)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertOverheadCosts(data: InsertOverheadCost) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getOverheadCostsByMonth(data.userId, data.month, data.year);
  
  if (existing) {
    await db.update(overheadCosts).set(data).where(eq(overheadCosts.id, existing.id));
    return existing;
  } else {
    const result = await db.insert(overheadCosts).values(data);
    return result;
  }
}

export async function getCurrentMonthOverheadCosts(userId: number) {
  const now = new Date();
  return getOverheadCostsByMonth(userId, now.getMonth() + 1, now.getFullYear());
}

// Pharmacy profile queries
export async function getPharmacyProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(pharmacyProfiles)
    .where(eq(pharmacyProfiles.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertPharmacyProfile(data: InsertPharmacyProfile) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getPharmacyProfileByUserId(data.userId);
  
  if (existing) {
    await db.update(pharmacyProfiles).set(data).where(eq(pharmacyProfiles.userId, data.userId));
    return existing;
  } else {
    const result = await db.insert(pharmacyProfiles).values(data);
    return result;
  }
}


// Monthly metrics queries
export async function getMonthlyMetricsByMonth(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(monthlyMetrics)
    .where(
      and(
        eq(monthlyMetrics.userId, userId),
        eq(monthlyMetrics.month, month),
        eq(monthlyMetrics.year, year)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertMonthlyMetrics(data: InsertMonthlyMetric) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getMonthlyMetricsByMonth(data.userId, data.month, data.year);
  
  if (existing) {
    await db.update(monthlyMetrics).set(data).where(eq(monthlyMetrics.id, existing.id));
    return existing;
  } else {
    const result = await db.insert(monthlyMetrics).values(data);
    return result;
  }
}

// Clear all user data
export async function clearAllUserData(userId: number, month?: number, year?: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    if (month !== undefined && year !== undefined) {
      // Use UTC dates to avoid timezone issues
      const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      
      console.log(`[clearAllUserData] Deleting data for month ${month}/${year}`);
      console.log(`[clearAllUserData] Date range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
      
      await db.delete(salesTransactions)
        .where(
          and(
            eq(salesTransactions.userId, userId),
            gte(salesTransactions.createdAt, monthStart),
            lte(salesTransactions.createdAt, monthEnd)
          )
        );
      console.log(`[clearAllUserData] Deleted sales transactions for month ${month}/${year}`);
      
      await db.delete(inventory)
        .where(
          and(
            eq(inventory.userId, userId),
            gte(inventory.createdAt, monthStart),
            lte(inventory.createdAt, monthEnd)
          )
        );
      console.log(`[clearAllUserData] Deleted inventory items for month ${month}/${year}`);
      
      await db.delete(alerts)
        .where(
          and(
            eq(alerts.userId, userId),
            gte(alerts.createdAt, monthStart),
            lte(alerts.createdAt, monthEnd)
          )
        );
      
      await db.delete(fileUploads)
        .where(
          and(
            eq(fileUploads.userId, userId),
            gte(fileUploads.createdAt, monthStart),
            lte(fileUploads.createdAt, monthEnd)
          )
        );
    } else {
      await db.delete(salesTransactions).where(eq(salesTransactions.userId, userId));
      await db.delete(inventory).where(eq(inventory.userId, userId));
      await db.delete(alerts).where(eq(alerts.userId, userId));
      await db.delete(fileUploads).where(eq(fileUploads.userId, userId));
      await db.delete(overheadCosts).where(eq(overheadCosts.userId, userId));
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error clearing user data:", error);
    throw error;
  }
}


/**
 * Save user preferences (pharmacy name, selected month, etc.)
 */
export async function saveUserPreferences(userId: number, preferences: Partial<InsertUserPreference>): Promise<UserPreference | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save preferences: database not available");
    return null;
  }

  try {
    const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

    if (existing.length > 0) {
      // Update existing preferences
      await db.update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId));
      
      const updated = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
      return updated[0] || null;
    } else {
      // Create new preferences
      await db.insert(userPreferences).values({
        userId,
        ...preferences,
      } as InsertUserPreference);
      
      const created = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
      return created[0] || null;
    }
  } catch (error) {
    console.error("Error saving user preferences:", error);
    throw error;
  }
}

/**
 * Load user preferences
 */
export async function loadUserPreferences(userId: number): Promise<UserPreference | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot load preferences: database not available");
    return null;
  }

  try {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error loading user preferences:", error);
    return null;
  }
}


/**
 * Remove duplicate inventory entries for the same product, keeping only the newest expiry date
 * For each product (by name and SKU), keeps the entry with the latest expiryDate
 */
export async function removeDuplicateInventory(userId: number): Promise<{ removed: number }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Get all inventory items for the user
    const allItems = await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId));

    // Group by productName and SKU to find duplicates
    const grouped: Record<string, Inventory[]> = {};
    for (const item of allItems) {
      const key = `${item.productName}|${item.sku || ""}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    // Find items to delete (keep the one with the latest expiryDate)
    const toDelete: number[] = [];
    for (const items of Object.values(grouped)) {
      if (items.length > 1) {
        // Sort by expiryDate descending (newest first)
        const sorted = items.sort((a, b) => {
          const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
          const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
          return dateB - dateA;
        });

        // Mark all but the first (newest) for deletion
        for (let i = 1; i < sorted.length; i++) {
          toDelete.push(sorted[i].id);
        }
      }
    }

    // Delete the old duplicates
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await db.delete(inventory).where(eq(inventory.id, id));
      }
    }

    return { removed: toDelete.length };
  } catch (error) {
    console.error("[Database] Error removing duplicates:", error);
    throw error;
  }
}
