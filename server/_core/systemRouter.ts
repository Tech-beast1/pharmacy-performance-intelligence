import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

/**
 * System router handles application-level operations like notifications.
 * The notifyOwner mutation now automatically includes the logged-in user's email
 * so notifications are sent to the user's email address.
 */

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const delivered = await notifyOwner({
        ...input,
        userEmail: ctx.user?.email || undefined,
      });
      return {
        success: delivered,
      } as const;
    }),
});
