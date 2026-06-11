import { getDb } from "./db";
import { users, uploadHistory, subscriptionPlans } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Track a file upload and increment upload count
 */
export async function trackUpload(
  userId: number,
  fileName: string,
  recordCount: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert into upload history
    await db.insert(uploadHistory).values({
      userId,
      fileName,
      recordCount,
    });

    // Get current upload count
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user.length) throw new Error("User not found");

    const currentCount = user[0].uploadCount || 0;
    const newCount = currentCount + 1;

    // Increment upload count
    await db
      .update(users)
      .set({ uploadCount: newCount })
      .where(eq(users.id, userId));

    return newCount;
  } catch (error) {
    console.error("[DB] Error tracking upload:", error);
    throw error;
  }
}

/**
 * Get current upload count for a user
 */
export async function getUploadCount(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user.length) throw new Error("User not found");
    return user[0].uploadCount || 0;
  } catch (error) {
    console.error("[DB] Error getting upload count:", error);
    throw error;
  }
}

/**
 * Check if user has reached free upload limit (4 uploads)
 */
export async function hasReachedFreeUploadLimit(userId: number) {
  try {
    const count = await getUploadCount(userId);
    return count >= 4;
  } catch (error) {
    console.error("[DB] Error checking upload limit:", error);
    throw error;
  }
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user.length) throw new Error("User not found");

    const userData = user[0];
    return {
      tier: userData.subscriptionTier,
      status: userData.subscriptionStatus,
      stripeCustomerId: userData.stripeCustomerId,
      stripeSubscriptionId: userData.stripeSubscriptionId,
      expiryDate: userData.subscriptionExpiryDate,
      uploadCount: userData.uploadCount,
    };
  } catch (error) {
    console.error("[DB] Error getting subscription:", error);
    throw error;
  }
}

/**
 * Update user subscription after successful payment
 */
export async function updateUserSubscription(
  userId: number,
  tier: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: "active",
        stripeCustomerId,
        stripeSubscriptionId,
        uploadCount: 0, // Reset free uploads after subscription
      })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error("[DB] Error updating subscription:", error);
    throw error;
  }
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(users)
      .set({
        subscriptionStatus: "canceled",
        subscriptionTier: "free",
      })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error("[DB] Error canceling subscription:", error);
    throw error;
  }
}

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
    return plans;
  } catch (error) {
    console.error("[DB] Error getting subscription plans:", error);
    throw error;
  }
}

/**
 * Get subscription plan by tier
 */
export async function getSubscriptionPlanByTier(tier: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.tier, tier));

    if (!plan.length) throw new Error(`Subscription plan not found: ${tier}`);
    return plan[0];
  } catch (error) {
    console.error("[DB] Error getting subscription plan:", error);
    throw error;
  }
}

/**
 * Initialize subscription plans (run once on setup)
 */
export async function initializeSubscriptionPlans() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const plans = [
      {
        name: "Silver",
        tier: "silver",
        price: 350,
        maxBranches: 1,
        description: "Single Pharmacy - Unlimited uploads",
      },
      {
        name: "Gold",
        tier: "gold",
        price: 850,
        maxBranches: 3,
        description: "Organization (2-3 Branches) - Unlimited uploads",
      },
      {
        name: "Diamond",
        tier: "diamond",
        price: 1500,
        maxBranches: 5,
        description: "Organization (4-5 Branches) - Unlimited uploads",
      },
      {
        name: "Platinum",
        tier: "platinum",
        price: 3000,
        maxBranches: null, // Unlimited
        description: "Organization (Unlimited Branches) - Unlimited uploads",
      },
    ];

    for (const plan of plans) {
      try {
        await db.insert(subscriptionPlans).values(plan);
      } catch (error: any) {
        // Ignore if plan already exists (unique constraint)
        if (!error.message?.includes("Duplicate")) {
          throw error;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("[DB] Error initializing subscription plans:", error);
    throw error;
  }
}
