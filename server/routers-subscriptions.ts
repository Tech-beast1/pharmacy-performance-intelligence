import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  trackUpload,
  getUploadCount,
  hasReachedFreeUploadLimit,
  getUserSubscription,
  updateUserSubscription,
  cancelUserSubscription,
  getSubscriptionPlans,
  getSubscriptionPlanByTier,
  initializeSubscriptionPlans,
} from "./db-subscriptions";
import { TRPCError } from "@trpc/server";
import { initializeTransaction, verifyTransaction, tierToPlanId } from "./paystack";

export const subscriptionRouter = router({
  /**
   * Get current user's upload count and subscription status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const uploadCount = await getUploadCount(ctx.user.id);
      const subscription = await getUserSubscription(ctx.user.id);
      const hasReachedLimit = await hasReachedFreeUploadLimit(ctx.user.id);

      return {
        uploadCount,
        freeUploadsRemaining: Math.max(0, 4 - uploadCount),
        hasReachedLimit,
        subscription,
      };
    } catch (error) {
      console.error("[tRPC] Error getting subscription status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subscription status",
      });
    }
  }),

  /**
   * Track a file upload
   */
  trackUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        recordCount: z.number().optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has reached limit and is not subscribed
        const subscription = await getUserSubscription(ctx.user.id);
        const hasReachedLimit = await hasReachedFreeUploadLimit(ctx.user.id);

        if (
          hasReachedLimit &&
          subscription.status !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Free upload limit reached. Please subscribe to continue.",
          });
        }

        // Track the upload
        const newCount = await trackUpload(
          ctx.user.id,
          input.fileName,
          input.recordCount
        );

        return {
          success: true,
          uploadCount: newCount,
          freeUploadsRemaining: Math.max(0, 4 - newCount),
          limitReached: newCount >= 4,
        };
      } catch (error) {
        console.error("[tRPC] Error tracking upload:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to track upload",
        });
      }
    }),

  /**
   * Get all subscription plans
   */
  getPlans: publicProcedure.query(async ({ ctx }) => {
    try {
      let plans = await getSubscriptionPlans();

      // Filter plans based on user type if authenticated
      if (ctx.user) {
        // For now, return all plans
        // Later, can filter based on organization vs single pharmacy
      }

      return plans;
    } catch (error) {
      console.error("[tRPC] Error getting subscription plans:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subscription plans",
      });
    }
  }),

  /**
   * Get a specific subscription plan by tier
   */
  getPlanByTier: publicProcedure
    .input(z.object({ tier: z.string() }))
    .query(async ({ input }) => {
      try {
        const plan = await getSubscriptionPlanByTier(input.tier);
        return plan;
      } catch (error) {
        console.error("[tRPC] Error getting plan by tier:", error);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription plan not found",
        });
      }
    }),

  /**
   * Create Paystack checkout session
   * This will be called from frontend when user clicks "Subscribe"
   */
  createCheckoutSession: protectedProcedure
    .input(z.object({ tier: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate tier is one of the valid options
        const validTiers = ["silver", "gold", "diamond", "platinum"];
        if (!validTiers.includes(input.tier)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid tier: ${input.tier}. Must be one of: ${validTiers.join(", ")}`,
          });
        }

        const plan = await getSubscriptionPlanByTier(input.tier);
        if (!plan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Plan not found for tier: ${input.tier}`,
          });
        }

        // Initialize Paystack transaction
        if (!ctx.user.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User email is required for payment",
          });
        }

        // Create reference that includes user ID for tracking
        const reference = `${ctx.user.id}-${input.tier}-${Date.now()}`;
        
        const transaction = await initializeTransaction(
          ctx.user.email,
          plan.price,
          reference
        );

        return {
          authorizationUrl: transaction.authorization_url,
          accessCode: transaction.access_code,
          reference: transaction.reference,
          // NOTE: tier is NOT returned to client to prevent URL manipulation
          // tier is determined server-side from payment amount during verification
          amount: plan.price,
        };
      } catch (error) {
        console.error("[tRPC] Error creating checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Verify Paystack payment and activate subscription
   * SECURITY: Tier is determined from payment amount, not from client input
   */
  verifyAndActivateSubscription: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the transaction with Paystack
        const transaction = await verifyTransaction(input.reference);

        if (!transaction.status || transaction.status !== "success") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment verification failed",
          });
        }

        // Determine tier from payment amount (in pesewas, divide by 100 to get GHS)
        const amountInGHS = transaction.amount / 100;
        let tier = "free";
        
        if (amountInGHS === 350) tier = "silver";
        else if (amountInGHS === 850) tier = "gold";
        else if (amountInGHS === 1500) tier = "diamond";
        else if (amountInGHS === 3000) tier = "platinum";
        else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid payment amount: ₵${amountInGHS}. Expected one of: 350, 850, 1500, 3000`,
          });
        }

        // Activate subscription with tier determined from payment amount
        await updateUserSubscription(
          ctx.user.id,
          tier,
          transaction.reference,
          transaction.reference
        );

        return {
          success: true,
          message: "Subscription activated successfully",
          tier,
          reference: transaction.reference,
        };
      } catch (error) {
        console.error("[tRPC] Error verifying payment:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify payment and activate subscription",
        });
      }
    }),



  /**
   * Cancel user subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await cancelUserSubscription(ctx.user.id);

      return {
        success: true,
        message: "Subscription canceled successfully",
      };
    } catch (error) {
      console.error("[tRPC] Error canceling subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Initialize subscription plans (admin only, run once)
   */
  initializePlans: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Only allow admin users
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can initialize subscription plans",
        });
      }

      await initializeSubscriptionPlans();

      return {
        success: true,
        message: "Subscription plans initialized",
      };
    } catch (error) {
      console.error("[tRPC] Error initializing plans:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initialize subscription plans",
      });
    }
  }),
});
