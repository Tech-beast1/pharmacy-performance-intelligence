/**
 * Database helper functions for multi-branch system
 * Handles organizations, branches, and branch-user relationships
 */

import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  organizations,
  branches,
  branchUsers,
  userTypes,
  inventory,
  salesTransactions,
  InsertOrganization,
  InsertBranch,
  InsertBranchUser,
  InsertUserType,
  Organization,
  Branch,
  BranchUser,
  UserType,
} from "../drizzle/schema";

/**
 * Get or create user type
 */
export async function getUserType(userId: number): Promise<UserType | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(userTypes).where(eq(userTypes.userId, userId));
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Error getting user type:", error);
    return null;
  }
}

/**
 * Set user type (organization_owner or single_pharmacy)
 */
export async function setUserType(userId: number, type: "organization_owner" | "single_pharmacy"): Promise<UserType | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if user type already exists
    const existing = await getUserType(userId);
    if (existing) {
      // Update existing
      await db.update(userTypes).set({ type, updatedAt: new Date() }).where(eq(userTypes.userId, userId));
      return getUserType(userId);
    }

    // Insert new
    const data: InsertUserType = { userId, type };
    await db.insert(userTypes).values(data);
    return getUserType(userId);
  } catch (error) {
    console.error("[DB] Error setting user type:", error);
    return null;
  }
}

/**
 * Create organization
 */
export async function createOrganization(ownerId: number, name: string): Promise<Organization | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const data: InsertOrganization = { ownerId, name };
    const result = await db.insert(organizations).values(data);
    
    if (result[0]?.insertId) {
      const org = await db.select().from(organizations).where(eq(organizations.id, result[0].insertId as number));
      return org[0] || null;
    }
    return null;
  } catch (error) {
    console.error("[DB] Error creating organization:", error);
    return null;
  }
}

/**
 * Get organization by ID
 */
export async function getOrganization(organizationId: number): Promise<Organization | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(organizations).where(eq(organizations.id, organizationId));
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Error getting organization:", error);
    return null;
  }
}

/**
 * Get all organizations for owner
 */
export async function getOrganizationsByOwner(ownerId: number): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(organizations).where(eq(organizations.ownerId, ownerId));
  } catch (error) {
    console.error("[DB] Error getting organizations:", error);
    return [];
  }
}

/**
 * Create branch
 */
export async function createBranch(
  organizationId: number,
  name: string,
  location?: string,
  managerName?: string,
  managerPhone?: string
): Promise<Branch | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const data: InsertBranch = {
      organizationId,
      name,
      location: location || null,
      managerName: managerName || null,
      managerPhone: managerPhone || null,
      isActive: true,
    };
    const result = await db.insert(branches).values(data);
    
    if (result[0]?.insertId) {
      const branch = await db.select().from(branches).where(eq(branches.id, result[0].insertId as number));
      return branch[0] || null;
    }
    return null;
  } catch (error) {
    console.error("[DB] Error creating branch:", error);
    return null;
  }
}

/**
 * Get branch by ID
 */
export async function getBranch(branchId: number): Promise<Branch | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(branches).where(eq(branches.id, branchId));
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Error getting branch:", error);
    return null;
  }
}

/**
 * Get all branches for organization
 */
export async function getBranchesByOrganization(organizationId: number): Promise<Branch[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(branches).where(eq(branches.organizationId, organizationId));
  } catch (error) {
    console.error("[DB] Error getting branches:", error);
    return [];
  }
}

/**
 * Update branch
 */
export async function updateBranch(
  branchId: number,
  updates: Partial<Omit<Branch, "id" | "createdAt">>
): Promise<Branch | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(branches).set({ ...updates, updatedAt: new Date() }).where(eq(branches.id, branchId));
    return getBranch(branchId);
  } catch (error) {
    console.error("[DB] Error updating branch:", error);
    return null;
  }
}

/**
 * Delete branch
 */
export async function deleteBranch(branchId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Delete branch users first
    await db.delete(branchUsers).where(eq(branchUsers.branchId, branchId));
    
    // Delete branch
    await db.delete(branches).where(eq(branches.id, branchId));
    return true;
  } catch (error) {
    console.error("[DB] Error deleting branch:", error);
    return false;
  }
}

/**
 * Add user to branch
 */
export async function addUserToBranch(
  userId: number,
  branchId: number,
  role: "owner" | "manager" | "staff" | "viewer" = "staff"
): Promise<BranchUser | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if user already has access to branch
    const existing = await db
      .select()
      .from(branchUsers)
      .where(and(eq(branchUsers.userId, userId), eq(branchUsers.branchId, branchId)));

    if (existing.length > 0) {
      // Update existing
      await db.update(branchUsers).set({ role, updatedAt: new Date() }).where(
        and(eq(branchUsers.userId, userId), eq(branchUsers.branchId, branchId))
      );
      // Return updated record
      const updated = await db
        .select()
        .from(branchUsers)
        .where(and(eq(branchUsers.userId, userId), eq(branchUsers.branchId, branchId)));
      return updated[0] || null;
    }

    // Insert new
    const data: InsertBranchUser = { userId, branchId, role };
    const result = await db.insert(branchUsers).values(data);
    
    if (result[0]?.insertId) {
      const bu = await db
        .select()
        .from(branchUsers)
        .where(eq(branchUsers.id, result[0].insertId as number));
      return bu[0] || null;
    }
    return null;
  } catch (error) {
    console.error("[DB] Error adding user to branch:", error);
    return null;
  }
}

/**
 * Remove user from branch
 */
export async function removeUserFromBranch(userId: number, branchId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(branchUsers)
      .where(and(eq(branchUsers.userId, userId), eq(branchUsers.branchId, branchId)));
    return true;
  } catch (error) {
    console.error("[DB] Error removing user from branch:", error);
    return false;
  }
}

/**
 * Get branches for user (with role)
 */
export async function getBranchesForUser(userId: number): Promise<(Branch & { role: string })[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: branches.id,
        organizationId: branches.organizationId,
        name: branches.name,
        location: branches.location,
        managerName: branches.managerName,
        managerPhone: branches.managerPhone,
        isActive: branches.isActive,
        createdAt: branches.createdAt,
        updatedAt: branches.updatedAt,
        role: branchUsers.role,
      })
      .from(branchUsers)
      .innerJoin(branches, eq(branchUsers.branchId, branches.id))
      .where(eq(branchUsers.userId, userId));

    return result as (Branch & { role: string })[];
  } catch (error) {
    console.error("[DB] Error getting branches for user:", error);
    return [];
  }
}

/**
 * Get users for branch
 */
export async function getUsersForBranch(branchId: number): Promise<BranchUser[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(branchUsers).where(eq(branchUsers.branchId, branchId));
  } catch (error) {
    console.error("[DB] Error getting users for branch:", error);
    return [];
  }
}

/**
 * Check if user has access to branch
 */
export async function userHasAccessToBranch(userId: number, branchId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .select()
      .from(branchUsers)
      .where(and(eq(branchUsers.userId, userId), eq(branchUsers.branchId, branchId)));
    return result.length > 0;
  } catch (error) {
    console.error("[DB] Error checking user access:", error);
    return false;
  }
}

/**
 * Get user role in branch
 */
export async function getUserRoleInBranch(userId: number, branchId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(branchUsers)
      .where(and(eq(branchUsers.userId, userId), eq(branchUsers.branchId, branchId)));
    return result[0]?.role || null;
  } catch (error) {
    console.error("[DB] Error getting user role:", error);
    return null;
  }
}


/**
 * Get consolidated metrics across all branches in an organization
 */
export async function getConsolidatedMetrics(organizationId: number, month: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get all branches for organization
    const orgBranches = await getBranchesByOrganization(organizationId);
    if (!orgBranches || orgBranches.length === 0) {
      return {
        totalRevenue: 0,
        estimatedProfit: 0,
        expiryRiskLoss: 0,
        deadStockValue: 0,
        expiryRiskCount: 0,
        deadStockCount: 0,
        lowMarginCount: 0,
        branches: []
      };
    }

    // Calculate metrics for each branch
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalExpiryRiskLoss = 0;
    let totalDeadStockValue = 0;
    let totalExpiryRiskCount = 0;
    let totalDeadStockCount = 0;
    let totalLowMarginCount = 0;

    for (const branch of orgBranches) {
      const branchMetrics = await getBranchMetrics(branch.id, month);
      if (branchMetrics) {
        totalRevenue += branchMetrics.totalRevenue || 0;
        totalProfit += branchMetrics.estimatedProfit || 0;
        totalExpiryRiskLoss += branchMetrics.expiryRiskLoss || 0;
        totalDeadStockValue += branchMetrics.deadStockValue || 0;
        totalExpiryRiskCount += branchMetrics.expiryRiskCount || 0;
        totalDeadStockCount += branchMetrics.deadStockCount || 0;
        totalLowMarginCount += branchMetrics.lowMarginCount || 0;
      }
    }

    return {
      totalRevenue,
      estimatedProfit: totalProfit,
      expiryRiskLoss: totalExpiryRiskLoss,
      deadStockValue: totalDeadStockValue,
      expiryRiskCount: totalExpiryRiskCount,
      deadStockCount: totalDeadStockCount,
      lowMarginCount: totalLowMarginCount,
      branches: orgBranches
    };
  } catch (error) {
    console.error("[DB] Error getting consolidated metrics:", error);
    return null;
  }
}

/**
 * Get metrics for a specific branch
 */
export async function getBranchMetrics(branchId: number, month: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const branch = await getBranch(branchId);
    if (!branch) return null;

    // Parse month (format: YYYY-MM) using UTC to avoid timezone issues
    const parts = month.split('-').map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1] || parts[1] < 1 || parts[1] > 12) {
      console.error("[DB] Invalid month format:", month);
      return null;
    }
    const [year, monthNum] = parts;
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("[DB] Invalid dates for month:", month, startDate, endDate);
      return null;
    }

    // Get sales transactions for this branch in the month
    const sales = await db
      .select()
      .from(salesTransactions)
      .where(
        and(
          eq(salesTransactions.branchId, branchId),
          gte(salesTransactions.createdAt, startDate),
          lt(salesTransactions.createdAt, endDate)
        )
      );

    // Get inventory for this branch in the month
    const inv = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.branchId, branchId),
          gte(inventory.createdAt, startDate),
          lt(inventory.createdAt, endDate)
        )
      );
    
    const activeInv = inv

    // Calculate metrics
    let totalRevenue = 0;
    let totalProfit = 0;
    let expiryRiskLoss = 0;
    let deadStockValue = 0;
    let expiryRiskCount = 0;
    let deadStockCount = 0;
    let lowMarginCount = 0;

    // Revenue from sales
    let totalCostPrice = 0;
    for (const sale of sales) {
      totalRevenue += typeof sale.totalSaleValue === 'number' ? sale.totalSaleValue : parseFloat(sale.totalSaleValue as any) || 0;
      
      // Get cost price from sale record if available
      if (sale.costPrice) {
        const costPrice = typeof sale.costPrice === 'number' ? sale.costPrice : parseFloat(sale.costPrice as any) || 0;
        const quantitySold = typeof sale.quantitySold === 'number' ? sale.quantitySold : parseFloat(sale.quantitySold as any) || 0;
        totalCostPrice += costPrice * quantitySold;
      }
    }
    
    // Estimated profit = Total Revenue - Total Cost Price
    totalProfit = totalRevenue - totalCostPrice;

    // Inventory analysis - deduplicate by product name to match frontend behavior
    // Use the START of the selected month for expiry risk calculation, not today's date
    // This ensures expiry risk is calculated from the month's perspective
    const monthStartDate = startDate; // Start of the selected month
    const thirtyDaysFromMonthStart = new Date(monthStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Deduplicate inventory items by product name (keep first occurrence)
    const deduplicatedInv = new Map<string, typeof activeInv[0]>();
    for (const item of activeInv) {
      const normalizedName = item.productName?.toLowerCase().trim() || '';
      if (!deduplicatedInv.has(normalizedName)) {
        deduplicatedInv.set(normalizedName, item);
      }
    }

    for (const item of Array.from(deduplicatedInv.values())) {
      // Expiry risk (products expiring within 30 days from the start of the selected month)
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        if (expiryDate > monthStartDate && expiryDate <= thirtyDaysFromMonthStart) {
          const costPrice = typeof item.costPrice === 'number' ? item.costPrice : parseFloat(item.costPrice as any) || 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity as any) || 0;
          expiryRiskLoss += costPrice * quantity;
          expiryRiskCount++;
        }
      }

      // Dead stock (products that have NOT been purchased - no sales activity)
      // Check if this product has any sales transactions
      const hasSales = sales.some(s => s.productName === item.productName);
      if (!hasSales) {
        const costPrice = typeof item.costPrice === 'number' ? item.costPrice : parseFloat(item.costPrice as any) || 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity as any) || 0;
        deadStockValue += costPrice * quantity;
        deadStockCount++;
      }

      // Low margin (less than 20%)
      if (item.price && item.costPrice) {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as any);
        const costPrice = typeof item.costPrice === 'number' ? item.costPrice : parseFloat(item.costPrice as any);
        const margin = ((price - costPrice) / price) * 100;
        if (margin < 20) {
          lowMarginCount++;
        }
      }
    }

    // Estimated profit is already calculated as Revenue - Cost Price
    const estimatedProfit = totalProfit;

    return {
      branchId,
      branchName: branch.name,
      branchLocation: branch.location,
      totalRevenue,
      estimatedProfit: Math.max(0, estimatedProfit),
      expiryRiskLoss,
      deadStockValue,
      expiryRiskCount,
      deadStockCount,
      lowMarginCount
    };
  } catch (error) {
    console.error("[DB] Error getting branch metrics:", error);
    return null;
  }
}

/**
 * Get branch breakdown/comparison data for all branches in organization
 */
export async function getBranchBreakdown(organizationId: number, month: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const orgBranches = await getBranchesByOrganization(organizationId);
    if (!orgBranches || orgBranches.length === 0) {
      return [];
    }

    // Parse month (format: YYYY-MM) - use UTC to match database timestamps
    const parts = month.split('-').map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1] || parts[1] < 1 || parts[1] > 12) {
      console.error("[DB] Invalid month format:", month);
      return [];
    }
    const [year, monthNum] = parts;
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 1));
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("[DB] Invalid dates for month:", month, startDate, endDate);
      return [];
    }

    // Get all branch IDs
    const branchIds = orgBranches.map(b => b.id);

    // Get sales for all branches in the month
    const allSales = await db
      .select()
      .from(salesTransactions)
      .where(
        and(
          inArray(salesTransactions.branchId, branchIds),
          gte(salesTransactions.createdAt, startDate),
          lt(salesTransactions.createdAt, endDate)
        )
      );

    // Calculate breakdown for each branch
    return orgBranches.map(branch => {
      const branchSales = allSales.filter(s => s.branchId === branch.id);
      const revenue = branchSales.reduce((sum, s) => sum + (typeof s.totalSaleValue === 'number' ? s.totalSaleValue : parseFloat(s.totalSaleValue as any) || 0), 0);
      const profit = branchSales.reduce((sum, s) => sum + (typeof s.profit === 'number' ? s.profit : parseFloat(s.profit as any) || 0), 0);
      const marginPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchLocation: branch.location,
        revenue,
        profit,
        marginPercentage
      };
    });
  } catch (error) {
    console.error("[DB] Error getting branch breakdown:", error);
    return null;
  }
}
