import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getInventoryByUserId, upsertInventoryItem, getSalesTransactionsByUserId, insertSalesTransaction, getAlertsByUserId, upsertAlert, insertFileUpload, updateFileUploadStatus, getOverheadCostsByMonth, upsertOverheadCosts, getCurrentMonthOverheadCosts, getPharmacyProfileByUserId, upsertPharmacyProfile, clearAllUserData } from "./db";
import { parseCSV, transformRow, validateMapping, detectColumns, getExcelSheets, type ColumnMapping } from "./utils/fileParser";
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
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        try {
          // First, check if it's an Excel file with multiple sheets
          let sheets = null;
          try {
            sheets = await getExcelSheets(input.csvContent);
          } catch (e) {
            // Not an Excel file, continue with CSV parsing
          }

          // If we have multiple sheets, return sheet information
          if (sheets && sheets.length > 1) {
            return { 
              success: true, 
              sheets: sheets.map(s => ({
                name: s.name,
                columns: s.columns,
                dataType: s.dataType
              })),
              multiSheet: true
            };
          }

          // Otherwise parse as single sheet/CSV
          const data = await parseCSV(input.csvContent);
          const columns = detectColumns(data);
          return { success: true, columns, sampleRow: data[0] || {}, multiSheet: false };
        } catch (error) {
          console.error('Column detection error:', error);
          return { success: false, error: 'Failed to detect columns' };
        }
      }),

    processFile: protectedProcedure
      .input(
        z.object({
          csvContent: z.string(),
          sheetName: z.string().optional(),
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
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const validation = validateMapping(input.mapping);
          if (!validation.valid) {
            return { success: false, errors: validation.errors };
          }

          // Parse CSV or Excel sheet
          const data = await parseCSV(input.csvContent, input.sheetName);
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
                costPrice: parsed.costPrice || 0,
                expiryDate: parsed.expiryDate,
              });

              // For SALES data: create sales transaction from quantity and price
              // If saleQuantity/saleDate not explicitly mapped, use quantity as saleQuantity and today as saleDate
              const dataType = (input.mapping as any).dataType || 'sales';
              if (dataType === 'sales' && parsed.quantity && parsed.price) {
                const saleQuantity = parsed.quantity;
                const saleDate = parsed.saleDate || new Date(); // Use today if no date provided
                const costPrice = parsed.costPrice || 0;
                const profit = (parsed.price - costPrice) * saleQuantity;
                
                await insertSalesTransaction({
                  userId: ctx.user!.id,
                  inventoryId: 0, // Will be linked after inventory insert
                  productName: parsed.productName,
                  quantitySold: saleQuantity,
                  salePrice: parsed.price,
                  totalSaleValue: parsed.price * saleQuantity,
                  costPrice,
                  profit,
                  saleDate,
                });
              }
              // For INVENTORY data: only create sales transaction if explicitly mapped
              else if (dataType === 'inventory' && parsed.saleQuantity && parsed.saleDate && parsed.sellingPrice) {
                const profit = (parsed.sellingPrice - (parsed.costPrice || 0)) * parsed.saleQuantity;
                await insertSalesTransaction({
                  userId: ctx.user!.id,
                  inventoryId: 0,
                  productName: parsed.productName,
                  quantitySold: parsed.saleQuantity,
                  salePrice: parsed.sellingPrice,
                  totalSaleValue: parsed.sellingPrice * parsed.saleQuantity,
                  costPrice: parsed.costPrice || 0,
                  profit,
                  saleDate: parsed.saleDate,
                });
              }

              processedCount++;
            } catch (error) {
              console.error('Error processing row:', error);
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

  // Dashboard analytics
  analytics: router({
    getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        const overheadCosts = await getCurrentMonthOverheadCosts(ctx.user!.id);
        const monthlyOverheadTotal = overheadCosts 
          ? Number(overheadCosts.rent) + Number(overheadCosts.salaries) + Number(overheadCosts.electricity) + Number(overheadCosts.others)
          : 0;
        const metrics = calculateDashboardMetrics(inventory, sales, undefined, monthlyOverheadTotal);
        return { success: true, data: metrics };
      } catch (error) {
        console.error('Dashboard metrics error:', error);
        return { success: false, error: 'Failed to calculate metrics' };
      }
    }),

    getAlerts: protectedProcedure.query(async ({ ctx }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        const alerts = identifyAlerts(inventory, sales);
        return { success: true, data: alerts };
      } catch (error) {
        console.error('Alerts error:', error);
        return { success: false, error: 'Failed to fetch alerts' };
      }
    }),

    getTopProducts: protectedProcedure.query(async ({ ctx }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const topProducts = getTopProfitableProducts(inventory);
        return { success: true, data: topProducts };
      } catch (error) {
        console.error('Top products error:', error);
        return { success: false, error: 'Failed to fetch top products' };
      }
    }),

    getRevenueTrend: protectedProcedure.query(async ({ ctx }) => {
      try {
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        const trend = getRevenueProfitTrend(sales);
        return { success: true, data: trend };
      } catch (error) {
        console.error('Revenue trend error:', error);
        return { success: false, error: 'Failed to fetch revenue trend' };
      }
    }),
  }),

  // Inventory management
  inventory: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      try {
        const items = await getInventoryByUserId(ctx.user!.id);
        return { success: true, data: items };
      } catch (error) {
        console.error('Inventory fetch error:', error);
        return { success: false, error: 'Failed to fetch inventory' };
      }
    }),
  }),

  // Overhead Costs Management
  overheadCosts: router({
    getByMonth: protectedProcedure
      .input(z.object({ month: z.number().min(1).max(12), year: z.number() }))
      .query(async ({ ctx, input }) => {
        const data = await getOverheadCostsByMonth(ctx.user!.id, input.month, input.year);
        return { success: true, data: data || { rent: 0, salaries: 0, electricity: 0, others: 0 } };
      }),

    save: protectedProcedure
      .input(
        z.object({
          month: z.number().min(1).max(12),
          year: z.number(),
          rent: z.number().min(0),
          salaries: z.number().min(0),
          electricity: z.number().min(0),
          others: z.number().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          await upsertOverheadCosts({
            userId: ctx.user!.id,
            month: input.month,
            year: input.year,
            rent: input.rent.toString(),
            salaries: input.salaries.toString(),
            electricity: input.electricity.toString(),
            others: input.others.toString(),
          } as any);
          return { success: true, message: 'Overhead costs saved successfully' };
        } catch (error) {
          console.error('Error saving overhead costs:', error);
          return { success: false, error: 'Failed to save overhead costs' };
        }
      }),
  }),

  // Pharmacy profile management
  pharmacy: router({
    getProfile: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const profile = await getPharmacyProfileByUserId(ctx.user!.id);
          return { success: true, profile };
        } catch (error) {
          console.error('Error fetching pharmacy profile:', error);
          return { success: false, error: 'Failed to fetch pharmacy profile' };
        }
      }),
    
    saveProfile: protectedProcedure
      .input(z.object({
        pharmacyName: z.string().min(1, 'Pharmacy name is required'),
        ownerName: z.string().min(1, 'Owner name is required'),
        location: z.string().optional(),
        setupDate: z.string().or(z.date()),
        reportStartDate: z.string().or(z.date()).optional(),
        reportEndDate: z.string().or(z.date()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const setupDate = typeof input.setupDate === 'string' 
            ? new Date(input.setupDate) 
            : input.setupDate;
          
          const reportStartDate = input.reportStartDate
            ? (typeof input.reportStartDate === 'string' 
              ? new Date(input.reportStartDate) 
              : input.reportStartDate)
            : null;
          
          const reportEndDate = input.reportEndDate
            ? (typeof input.reportEndDate === 'string' 
              ? new Date(input.reportEndDate) 
              : input.reportEndDate)
            : null;
          
          await upsertPharmacyProfile({
            userId: ctx.user!.id,
            pharmacyName: input.pharmacyName,
            ownerName: input.ownerName,
            location: input.location,
            setupDate: setupDate as any,
            reportStartDate: reportStartDate as any,
            reportEndDate: reportEndDate as any,
          });
          
          return { success: true, message: 'Pharmacy profile saved successfully' };
        } catch (error) {
          console.error('Error saving pharmacy profile:', error);
          return { success: false, error: 'Failed to save pharmacy profile' };
        }
      }),
  }),

  // Data management
  data: router({
    clearAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        try {
          await clearAllUserData(ctx.user!.id);
          return { success: true, message: 'All data cleared successfully' };
        } catch (error) {
          console.error('Error clearing user data:', error);
          return { success: false, error: 'Failed to clear data' };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
