/**
 * Database helper functions for multi-branch system
 * Handles organizations, branches, and branch-user relationships
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  organizations,
  branches,
  branchUsers,
  userTypes,
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

    // Return branch metrics (will be calculated from branch-specific data)
    return {
      branchId,
      branchName: branch.name,
      branchLocation: branch.location,
      totalRevenue: 0,
      estimatedProfit: 0,
      expiryRiskLoss: 0,
      deadStockValue: 0,
      expiryRiskCount: 0,
      deadStockCount: 0,
      lowMarginCount: 0
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

    // Return branch breakdown data for comparison
    return orgBranches.map(branch => ({
      branchId: branch.id,
      branchName: branch.name,
      branchLocation: branch.location,
      revenue: 0,
      profit: 0,
      marginPercentage: 0
    }));
  } catch (error) {
    console.error("[DB] Error getting branch breakdown:", error);
    return null;
  }
}
