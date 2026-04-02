import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inventory, salesTransactions, alerts, fileUploads, overheadCosts } from "../drizzle/schema";
import { ENV } from './_core/env';

import type { Inventory, SalesTransaction, Alert, FileUpload, OverheadCost, InsertOverheadCost } from "../drizzle/schema";

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
