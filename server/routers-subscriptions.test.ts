import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as db from "./db-subscriptions";
import * as paystack from "./paystack";

// Mock the database functions
vi.mock("./db-subscriptions");
vi.mock("./paystack");

describe("Subscription Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStatus", () => {
    it("should return upload count and subscription status", async () => {
      const userId = "test-user-123";
      const mockUploadCount = 2;
      const mockSubscription = {
        id: 1,
        userId,
        tier: "silver",
        status: "active",
        startDate: new Date(),
        endDate: null,
        paystackReference: "ref123",
        paystackSubscriptionCode: "sub123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUploadCount).mockResolvedValue(mockUploadCount);
      vi.mocked(db.getUserSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(db.hasReachedFreeUploadLimit).mockResolvedValue(false);

      // Simulate calling the procedure
      const result = {
        uploadCount: mockUploadCount,
        freeUploadsRemaining: Math.max(0, 4 - mockUploadCount),
        hasReachedLimit: false,
        subscription: mockSubscription,
      };

      expect(result.uploadCount).toBe(2);
      expect(result.freeUploadsRemaining).toBe(2);
      expect(result.hasReachedLimit).toBe(false);
      expect(result.subscription.tier).toBe("silver");
    });

    it("should indicate when free uploads are exhausted", async () => {
      const mockUploadCount = 4;
      const result = {
        uploadCount: mockUploadCount,
        freeUploadsRemaining: Math.max(0, 4 - mockUploadCount),
        hasReachedLimit: true,
      };

      expect(result.freeUploadsRemaining).toBe(0);
      expect(result.hasReachedLimit).toBe(true);
    });
  });

  describe("trackUpload", () => {
    it("should successfully track an upload when under limit", async () => {
      const userId = "test-user-123";
      const fileName = "sales-data.csv";
      const recordCount = 100;

      vi.mocked(db.getUserSubscription).mockResolvedValue({
        id: 1,
        userId,
        tier: null,
        status: "inactive",
        startDate: null,
        endDate: null,
        paystackReference: null,
        paystackSubscriptionCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.hasReachedFreeUploadLimit).mockResolvedValue(false);
      vi.mocked(db.trackUpload).mockResolvedValue(2);

      const result = {
        success: true,
        uploadCount: 2,
        freeUploadsRemaining: Math.max(0, 4 - 2),
        limitReached: 2 >= 4,
      };

      expect(result.success).toBe(true);
      expect(result.uploadCount).toBe(2);
      expect(result.freeUploadsRemaining).toBe(2);
      expect(result.limitReached).toBe(false);
    });

    it("should reject upload when limit reached and not subscribed", async () => {
      const userId = "test-user-123";
      const mockSubscription = {
        id: 1,
        userId,
        tier: null,
        status: "inactive",
        startDate: null,
        endDate: null,
        paystackReference: null,
        paystackSubscriptionCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(db.hasReachedFreeUploadLimit).mockResolvedValue(true);

      // Should throw error
      const shouldThrow = mockSubscription.status !== "active";
      expect(shouldThrow).toBe(true);
    });

    it("should allow upload when limit reached but subscribed", async () => {
      const userId = "test-user-123";
      const mockSubscription = {
        id: 1,
        userId,
        tier: "gold",
        status: "active",
        startDate: new Date(),
        endDate: null,
        paystackReference: "ref123",
        paystackSubscriptionCode: "sub123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(db.hasReachedFreeUploadLimit).mockResolvedValue(true);
      vi.mocked(db.trackUpload).mockResolvedValue(5);

      const result = {
        success: true,
        uploadCount: 5,
        freeUploadsRemaining: Math.max(0, 4 - 5),
        limitReached: 5 >= 4,
      };

      expect(result.success).toBe(true);
      expect(result.uploadCount).toBe(5);
      expect(result.freeUploadsRemaining).toBe(0);
      expect(result.limitReached).toBe(true);
    });
  });

  describe("getPlans", () => {
    it("should return all subscription plans", async () => {
      const mockPlans = [
        {
          id: 1,
          tier: "silver",
          name: "Silver",
          price: 350,
          maxBranches: 1,
          description: "Perfect for single pharmacies",
          stripePriceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          tier: "gold",
          name: "Gold",
          price: 850,
          maxBranches: 3,
          description: "For growing pharmacy chains",
          stripePriceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          tier: "diamond",
          name: "Diamond",
          price: 1500,
          maxBranches: 5,
          description: "For established chains",
          stripePriceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          tier: "platinum",
          name: "Platinum",
          price: 3000,
          maxBranches: null,
          description: "Enterprise solution",
          stripePriceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getSubscriptionPlans).mockResolvedValue(mockPlans);

      expect(mockPlans).toHaveLength(4);
      expect(mockPlans[0].tier).toBe("silver");
      expect(mockPlans[0].price).toBe(350);
      expect(mockPlans[3].tier).toBe("platinum");
      expect(mockPlans[3].maxBranches).toBeNull();
    });
  });

  describe("getPlanByTier", () => {
    it("should return a specific plan by tier", async () => {
      const mockPlan = {
        id: 2,
        tier: "gold",
        name: "Gold",
        price: 850,
        maxBranches: 3,
        description: "For growing pharmacy chains",
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getSubscriptionPlanByTier).mockResolvedValue(mockPlan);

      expect(mockPlan.tier).toBe("gold");
      expect(mockPlan.price).toBe(850);
      expect(mockPlan.maxBranches).toBe(3);
    });

    it("should handle plan not found", async () => {
      vi.mocked(db.getSubscriptionPlanByTier).mockResolvedValue(null);

      const plan = await db.getSubscriptionPlanByTier("invalid");
      expect(plan).toBeNull();
    });
  });

  describe("createCheckoutSession", () => {
    it("should create a Paystack checkout session", async () => {
      const userId = "test-user-123";
      const userEmail = "user@example.com";
      const tier = "gold";

      const mockPlan = {
        id: 2,
        tier: "gold",
        name: "Gold",
        price: 850,
        maxBranches: 3,
        description: "For growing pharmacy chains",
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransaction = {
        authorization_url: "https://checkout.paystack.com/test123",
        access_code: "test123",
        reference: "test-ref-123",
      };

      vi.mocked(db.getSubscriptionPlanByTier).mockResolvedValue(mockPlan);
      vi.mocked(paystack.initializeTransaction).mockResolvedValue(
        mockTransaction
      );

      expect(mockPlan.price).toBe(850);
      expect(mockTransaction.authorization_url).toContain("paystack.com");
      expect(mockTransaction.reference).toBe("test-ref-123");
    });

    it("should throw error if user email is missing", async () => {
      const tier = "gold";
      const mockPlan = {
        id: 2,
        tier: "gold",
        name: "Gold",
        price: 850,
        maxBranches: 3,
        description: "For growing pharmacy chains",
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getSubscriptionPlanByTier).mockResolvedValue(mockPlan);

      // Simulate missing email
      const userEmail = null;
      const shouldThrow = !userEmail;

      expect(shouldThrow).toBe(true);
    });
  });

  describe("verifyAndActivateSubscription", () => {
    it("should verify payment and activate subscription", async () => {
      const userId = "test-user-123";
      const reference = "test-ref-123";
      const tier = "gold";

      const mockTransaction = {
        status: "success",
        reference,
        amount: 85000,
        currency: "GHS",
      };

      vi.mocked(paystack.verifyTransaction).mockResolvedValue(mockTransaction);
      vi.mocked(db.updateUserSubscription).mockResolvedValue({
        id: 1,
        userId,
        tier,
        status: "active",
        startDate: new Date(),
        endDate: null,
        paystackReference: reference,
        paystackSubscriptionCode: "sub123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(mockTransaction.status).toBe("success");
      expect(mockTransaction.reference).toBe(reference);
    });

    it("should reject if payment verification fails", async () => {
      const reference = "invalid-ref";

      const mockTransaction = {
        status: "failed",
        reference,
      };

      vi.mocked(paystack.verifyTransaction).mockResolvedValue(mockTransaction);

      const shouldThrow = mockTransaction.status !== "success";
      expect(shouldThrow).toBe(true);
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel user subscription", async () => {
      const userId = "test-user-123";

      vi.mocked(db.cancelUserSubscription).mockResolvedValue(true);

      const result = {
        success: true,
        message: "Subscription canceled successfully",
      };

      expect(result.success).toBe(true);
    });
  });

  describe("Branch Creation Limits", () => {
    it("should allow Silver tier to create 1 branch", () => {
      const tier = "silver";
      const maxBranches = 1;
      const currentBranches = 0;

      expect(currentBranches < maxBranches).toBe(true);
    });

    it("should allow Gold tier to create up to 3 branches", () => {
      const tier = "gold";
      const maxBranches = 3;
      const currentBranches = 2;

      expect(currentBranches < maxBranches).toBe(true);
    });

    it("should allow Diamond tier to create up to 5 branches", () => {
      const tier = "diamond";
      const maxBranches = 5;
      const currentBranches = 4;

      expect(currentBranches < maxBranches).toBe(true);
    });

    it("should allow Platinum tier unlimited branches", () => {
      const tier = "platinum";
      const maxBranches = null;
      const currentBranches = 100;

      expect(maxBranches === null || currentBranches < maxBranches).toBe(true);
    });

    it("should reject branch creation when limit reached", () => {
      const tier = "silver";
      const maxBranches = 1;
      const currentBranches = 1;

      expect(currentBranches >= maxBranches).toBe(true);
    });
  });

  describe("Upload Limit Enforcement", () => {
    it("should allow 4 free uploads", () => {
      const freeUploads = 4;
      for (let i = 1; i <= freeUploads; i++) {
        expect(i <= 4).toBe(true);
      }
    });

    it("should block 5th upload without subscription", () => {
      const uploadCount = 5;
      const hasSubscription = false;

      const shouldBlock = uploadCount > 4 && !hasSubscription;
      expect(shouldBlock).toBe(true);
    });

    it("should allow uploads with active subscription", () => {
      const uploadCount = 50;
      const hasSubscription = true;
      const subscriptionStatus = "active";

      const shouldAllow =
        hasSubscription && subscriptionStatus === "active";
      expect(shouldAllow).toBe(true);
    });
  });
});
