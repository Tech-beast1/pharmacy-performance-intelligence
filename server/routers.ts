import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getInventoryByUserId, upsertInventoryItem, getSalesTransactionsByUserId, insertSalesTransaction, getAlertsByUserId, upsertAlert, insertFileUpload, updateFileUploadStatus, getOverheadCostsByMonth, upsertOverheadCosts } from "./db";
import { parseCSV, transformRow, validateMapping, detectColumns, type ColumnMapping } from "./utils/fileParser";
import { parseExcelBuffer, excelToCSV } from "./utils/excelParser";
import { calculateDashboardMetrics, identifyAlerts, getTopProfitableProducts, getRevenueProfitTrend } from "./utils/analytics";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // File upload and data management
  upload: router({
    detectColumns: protectedProcedure
      .input(z.object({ csvContent: z.string(), isExcel: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        try {
          let data: any[] = [];
          
          if (input.isExcel) {
            // Parse as Excel from base64
            const buffer = Buffer.from(input.csvContent, 'base64');
            const { data: excelData } = parseExcelBuffer(buffer);
            data = excelData;
          } else {
            // Parse as CSV
            data = await parseCSV(input.csvContent);
          }
          
          const columns = detectColumns(data);
          return { success: true, columns, sampleRow: data[0] || {} };
        } catch (error) {
          console.error('Column detection error:', error);
          return { success: false, error: 'Failed to detect columns' };
        }
      }),

    processFile: protectedProcedure
      .input(
        z.object({
          csvContent: z.string(),
          mapping: z.object({
            productName: z.string(),
            price: z.string().optional(),
            quantity: z.string().optional(),
            expiryDate: z.string().optional(),
            costPrice: z.string().optional(),
            sellingPrice: z.string().optional(),
            stockOnHand: z.string().optional(),
            qtySold90Days: z.string().optional(),
            sku: z.string().optional(),
            saleQuantity: z.string().optional(),
            saleDate: z.string().optional(),
            dataType: z.enum(['sales', 'inventory']).optional(),
          }),
          fileName: z.string(),
          isExcel: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          let csvContent = input.csvContent;
          
          // If Excel file, convert to CSV
          if (input.isExcel) {
            const buffer = Buffer.from(input.csvContent, 'base64');
            csvContent = excelToCSV(buffer);
          }
          
          const validation = validateMapping(input.mapping as ColumnMapping);
          if (!validation.valid) {
            return { success: false, errors: validation.errors };
          }

          // Parse CSV
          const data = await parseCSV(csvContent);
          let processedCount = 0;
          let errorCount = 0;

          // Process each row
          for (const row of data) {
            try {
              const parsed = transformRow(row, input.mapping as ColumnMapping);
              if (!parsed) {
                errorCount++;
                continue;
              }

              // Upsert inventory item
              const sku = parsed.sku || parsed.productName;
              await upsertInventoryItem({
                userId: ctx.user!.id,
                productName: parsed.productName,
                sku,
                quantity: parsed.quantity || parsed.stockOnHand || 0,
                price: parsed.price || parsed.sellingPrice || 0,
                costPrice: parsed.costPrice,
                expiryDate: parsed.expiryDate,
              });

              // If sales data provided, insert transaction
              if (parsed.saleQuantity && parsed.saleDate && parsed.price) {
                const profit = (parsed.price - (parsed.costPrice || 0)) * parsed.saleQuantity;
                await insertSalesTransaction({
                  userId: ctx.user!.id,
                  inventoryId: 0, // Will be linked after inventory insert
                  productName: parsed.productName,
                  quantitySold: parsed.saleQuantity,
                  salePrice: parsed.price,
                  totalSaleValue: parsed.price * parsed.saleQuantity,
                  costPrice: parsed.costPrice,
                  profit,
                  saleDate: parsed.saleDate,
                });
              }

              processedCount++;
            } catch (rowError) {
              console.error('Row processing error:', rowError);
              errorCount++;
            }
          }

          return {
            success: true,
            processedCount,
            errorCount,
            message: `Successfully processed ${processedCount} items`,
          };
        } catch (error) {
          console.error('File processing error:', error);
          return { success: false, error: 'Failed to process file' };
        }
      }),
  }),

  // Dashboard metrics
  dashboard: router({
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        const alerts = await getAlertsByUserId(ctx.user!.id);
        const now = new Date();
        const overhead = await getOverheadCostsByMonth(ctx.user!.id, now.getMonth() + 1, now.getFullYear());

        const metrics = calculateDashboardMetrics(inventory, sales);
        const topProducts = getTopProfitableProducts(inventory, 10);
        const trend = getRevenueProfitTrend(sales || []);

        return {
          success: true,
          metrics,
          alerts,
          topProducts,
          trend,
        };
      } catch (error) {
        console.error('Dashboard metrics error:', error);
        return { success: false, error: 'Failed to fetch metrics' };
      }
    }),
  }),

  // Overhead costs management
  overheadCosts: router({
    getByMonth: protectedProcedure
      .input(z.object({ month: z.number().min(1).max(12), year: z.number() }))
      .query(async ({ input, ctx }) => {
        try {
          const costs = await getOverheadCostsByMonth(ctx.user!.id, input.month, input.year);
          return { success: true, data: costs };
        } catch (error) {
          console.error('Get overhead costs error:', error);
          return { success: false, data: null, error: 'Failed to fetch overhead costs' };
        }
      }),

    upsert: protectedProcedure
      .input(
        z.object({
          month: z.number().min(1).max(12),
          year: z.number(),
          rent: z.string().default('0'),
          salaries: z.string().default('0'),
          electricity: z.string().default('0'),
          others: z.string().default('0'),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await upsertOverheadCosts({
            userId: ctx.user!.id,
            month: input.month,
            year: input.year,
            rent: input.rent,
            salaries: input.salaries,
            electricity: input.electricity,
            others: input.others,
          });
          return { success: true, message: 'Overhead costs updated' };
        } catch (error) {
          console.error('Upsert overhead costs error:', error);
          return { success: false, error: 'Failed to update overhead costs' };
        }
      }),
  }),

  // Inventory management
  inventory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        return { success: true, data: inventory };
      } catch (error) {
        console.error('List inventory error:', error);
        return { success: false, error: 'Failed to fetch inventory' };
      }
    }),
  }),

  // Sales transactions
  sales: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        return { success: true, data: sales };
      } catch (error) {
        console.error('List sales error:', error);
        return { success: false, error: 'Failed to fetch sales' };
      }
    }),
  }),

  // Alerts
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const alerts = await getAlertsByUserId(ctx.user!.id);
        return { success: true, data: alerts };
      } catch (error) {
        console.error('List alerts error:', error);
        return { success: false, error: 'Failed to fetch alerts' };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
