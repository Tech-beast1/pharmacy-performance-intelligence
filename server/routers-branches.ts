/**
 * tRPC routes for multi-branch system
 * Handles organizations, branches, and branch user management
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getUserType,
  setUserType,
  createOrganization,
  getOrganization,
  getOrganizationsByOwner,
  createBranch,
  getBranch,
  getBranchesByOrganization,
  updateBranch,
  deleteBranch,
  addUserToBranch,
  removeUserFromBranch,
  getBranchesForUser,
  getUsersForBranch,
  userHasAccessToBranch,
  getUserRoleInBranch,
  getConsolidatedMetrics,
  getBranchMetrics,
  getBranchBreakdown,
} from "./db-branches";

export const branchesRouter = router({
  // User Type Management
  userType: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      try {
        const userType = await getUserType(ctx.user!.id);
        return { success: true, data: userType };
      } catch (error) {
        console.error("[tRPC] Error getting user type:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get user type" });
      }
    }),

    set: protectedProcedure
      .input(z.object({
        type: z.enum(["organization_owner", "single_pharmacy"]),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await setUserType(ctx.user!.id, input.type);
          return { success: true, data: result };
        } catch (error) {
          console.error("[tRPC] Error setting user type:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to set user type" });
        }
      }),
  }),

  // Organization Management
  organization: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Organization name is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Create organization (setUserType will be called after branch creation)
          const org = await createOrganization(ctx.user!.id, input.name);
          if (!org) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create organization" });
          }

          return { success: true, data: org };
        } catch (error) {
          console.error("[tRPC] Error creating organization:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create organization" });
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const orgs = await getOrganizationsByOwner(ctx.user!.id);
        return { success: true, data: orgs };
      } catch (error) {
        console.error("[tRPC] Error listing organizations:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list organizations" });
      }
    }),

    get: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const org = await getOrganization(input.organizationId);
          if (!org) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
          }

          // Verify user is owner
          if (org.ownerId !== ctx.user!.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this organization" });
          }

          return { success: true, data: org };
        } catch (error) {
          console.error("[tRPC] Error getting organization:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get organization" });
        }
      }),
  }),

  // Branch Management
  branch: router({
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        name: z.string().min(1, "Branch name is required"),
        location: z.string().optional(),
        managerName: z.string().optional(),
        managerPhone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify user is organization owner
          const org = await getOrganization(input.organizationId);
          if (!org || org.ownerId !== ctx.user!.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to create branches" });
          }

          const branch = await createBranch(
            input.organizationId,
            input.name,
            input.location,
            input.managerName,
            input.managerPhone
          );

          if (!branch) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create branch" });
          }

          // Add owner to branch
          await addUserToBranch(ctx.user!.id, branch.id, "owner");

          // Set user type to organization_owner (only once after branch creation)
          await setUserType(ctx.user!.id, "organization_owner");

          return { success: true, data: branch };
        } catch (error) {
          console.error("[tRPC] Error creating branch:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create branch" });
        }
      }),

    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify user is organization owner
          const org = await getOrganization(input.organizationId);
          if (!org || org.ownerId !== ctx.user!.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this organization" });
          }

          const branches = await getBranchesByOrganization(input.organizationId);
          return { success: true, data: branches };
        } catch (error) {
          console.error("[tRPC] Error listing branches:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list branches" });
        }
      }),

    get: protectedProcedure
      .input(z.object({ branchId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify user has access to branch
          const hasAccess = await userHasAccessToBranch(ctx.user!.id, input.branchId);
          if (!hasAccess) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this branch" });
          }

          const branch = await getBranch(input.branchId);
          if (!branch) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
          }

          return { success: true, data: branch };
        } catch (error) {
          console.error("[tRPC] Error getting branch:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get branch" });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        branchId: z.number(),
        name: z.string().optional(),
        location: z.string().optional(),
        managerName: z.string().optional(),
        managerPhone: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify user is branch owner
          const role = await getUserRoleInBranch(ctx.user!.id, input.branchId);
          if (role !== "owner") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only branch owners can update branch details" });
          }

          const branch = await updateBranch(input.branchId, {
            name: input.name,
            location: input.location,
            managerName: input.managerName,
            managerPhone: input.managerPhone,
            isActive: input.isActive,
          });

          if (!branch) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
          }

          return { success: true, data: branch };
        } catch (error) {
          console.error("[tRPC] Error updating branch:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update branch" });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ branchId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify user is branch owner
          const role = await getUserRoleInBranch(ctx.user!.id, input.branchId);
          if (role !== "owner") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only branch owners can delete branches" });
          }

          const success = await deleteBranch(input.branchId);
          if (!success) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete branch" });
          }

          return { success: true };
        } catch (error) {
          console.error("[tRPC] Error deleting branch:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete branch" });
        }
      }),

    listForUser: protectedProcedure.query(async ({ ctx }) => {
      try {
        const branches = await getBranchesForUser(ctx.user!.id);
        return { success: true, data: branches };
      } catch (error) {
        console.error("[tRPC] Error listing branches for user:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list branches" });
      }
    }),
  }),

  // Branch User Management
  branchUser: router({
    add: protectedProcedure
      .input(z.object({
        branchId: z.number(),
        userId: z.number(),
        role: z.enum(["owner", "manager", "staff", "viewer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify requester is branch owner
          const requesterRole = await getUserRoleInBranch(ctx.user!.id, input.branchId);
          if (requesterRole !== "owner") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only branch owners can add users" });
          }

          const result = await addUserToBranch(input.userId, input.branchId, input.role);
          if (!result) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add user" });
          }

          return { success: true, data: result };
        } catch (error) {
          console.error("[tRPC] Error adding user to branch:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add user" });
        }
      }),

    remove: protectedProcedure
      .input(z.object({
        branchId: z.number(),
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify requester is branch owner
          const requesterRole = await getUserRoleInBranch(ctx.user!.id, input.branchId);
          if (requesterRole !== "owner") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only branch owners can remove users" });
          }

          const success = await removeUserFromBranch(input.userId, input.branchId);
          if (!success) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove user" });
          }

          return { success: true };
        } catch (error) {
          console.error("[tRPC] Error removing user from branch:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove user" });
        }
      }),

    list: protectedProcedure
      .input(z.object({ branchId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify user has access to branch
          const hasAccess = await userHasAccessToBranch(ctx.user!.id, input.branchId);
          if (!hasAccess) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this branch" });
          }

          const users = await getUsersForBranch(input.branchId);
          return { success: true, data: users };
        } catch (error) {
          console.error("[tRPC] Error listing branch users:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list branch users" });
        }
      }),

    getRole: protectedProcedure
      .input(z.object({ branchId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const role = await getUserRoleInBranch(ctx.user!.id, input.branchId);
          return { success: true, data: { role } };
        } catch (error) {
          console.error("[tRPC] Error getting user role:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get user role" });
        }
      }),
  }),

  // Metrics aggregation
  metrics: router({
    consolidated: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        month: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify user is organization owner
          const org = await getOrganization(input.organizationId);
          if (!org || org.ownerId !== ctx.user!.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this organization" });
          }

          const metrics = await getConsolidatedMetrics(input.organizationId, input.month);
          return { success: true, data: metrics };
        } catch (error) {
          console.error("[tRPC] Error getting consolidated metrics:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get consolidated metrics" });
        }
      }),

    branch: protectedProcedure
      .input(z.object({
        branchId: z.number(),
        month: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify user has access to branch
          const hasAccess = await userHasAccessToBranch(ctx.user!.id, input.branchId);
          if (!hasAccess) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this branch" });
          }

          const metrics = await getBranchMetrics(input.branchId, input.month);
          return { success: true, data: metrics };
        } catch (error) {
          console.error("[tRPC] Error getting branch metrics:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get branch metrics" });
        }
      }),

    breakdown: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        month: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify user is organization owner
          const org = await getOrganization(input.organizationId);
          if (!org || org.ownerId !== ctx.user!.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this organization" });
          }

          const breakdown = await getBranchBreakdown(input.organizationId, input.month);
          return { success: true, data: breakdown };
        } catch (error) {
          console.error("[tRPC] Error getting branch breakdown:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get branch breakdown" });
        }
      }),
  }),
});
