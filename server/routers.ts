import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getInventoryByUserId, upsertInventoryItem, getSalesTransactionsByUserId, insertSalesTransaction, getAlertsByUserId, upsertAlert, insertFileUpload, updateFileUploadStatus, getOverheadCostsByMonth, upsertOverheadCosts, getPharmacyProfileByUserId, upsertPharmacyProfile, clearAllUserData, getMonthlyMetricsByMonth, upsertMonthlyMetrics, saveUserPreferences, loadUserPreferences, removeDuplicateInventory } from "./db";
import { parseCSV, transformRow, validateMapping, detectColumns, getExcelSheets, type ColumnMapping } from "./utils/fileParser";
import { calculateDashboardMetrics, identifyAlerts, getTopProfitableProducts, getRevenueProfitTrend } from "./utils/analytics";
import { generateKeyInsights } from "./utils/insights";

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

  // User preferences (persisted across sessions)
  preferences: router({
    save: protectedProcedure
      .input(z.object({
        pharmacyName: z.string().optional(),
        selectedMonth: z.string().optional(),
        selectedYear: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await saveUserPreferences(ctx.user!.id, input);
          return { success: true, data: result };
        } catch (error) {
          console.error('Error saving preferences:', error);
          return { success: false, error: 'Failed to save preferences' };
        }
      }),
    
    load: protectedProcedure.query(async ({ ctx }) => {
      try {
        const result = await loadUserPreferences(ctx.user!.id);
        return { success: true, data: result };
      } catch (error) {
        console.error('Error loading preferences:', error);
        return { success: false, error: 'Failed to load preferences' };
      }
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
          uploadDate: z.date().optional(),
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

              // Insert new inventory item (create new record for each upload, don't update existing)
              // This ensures each month has its own separate inventory records
              const sku = parsed.sku || parsed.productName;
              // Add month suffix to SKU to make it unique per month
              const monthSuffix = input.uploadDate ? `-${input.uploadDate.getFullYear()}-${String(input.uploadDate.getMonth() + 1).padStart(2, '0')}` : '';
              const uniqueSku = sku + monthSuffix;
              
              await upsertInventoryItem({
                userId: ctx.user!.id,
                productName: parsed.productName,
                sku: uniqueSku,
                quantity: parsed.quantity || parsed.stockOnHand || 0,
                price: parsed.price || parsed.sellingPrice || 0,
                costPrice: parsed.costPrice || 0,
                expiryDate: parsed.expiryDate,
                createdAt: input.uploadDate || new Date(),
              });

              // For SALES data: create sales transaction from quantity and price
              // If saleQuantity/saleDate not explicitly mapped, use quantity as saleQuantity and uploadDate as saleDate
              const dataType = (input.mapping as any).dataType || 'sales';
              if (dataType === 'sales' && parsed.quantity && parsed.price) {
                const saleQuantity = parsed.quantity;
                const saleDate = parsed.saleDate || input.uploadDate || new Date(); // Use uploadDate if provided, otherwise today
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
                  createdAt: input.uploadDate || new Date(),
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
                  createdAt: input.uploadDate || new Date(),
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
    getDashboardMetrics: protectedProcedure
      .input(z.object({ 
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        durationDays: z.number().optional().default(60) 
      }))
      .query(async ({ ctx, input }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        
        // Determine which month to get overhead costs for
        let month: number;
        let year: number;
        
        if (input.startDate) {
          // Parse date string as UTC to avoid timezone issues
          // Date string format: "2026-05-01"
          const [yearStr, monthStr] = input.startDate.split('-');
          month = parseInt(monthStr, 10);
          year = parseInt(yearStr, 10);
        } else {
          const now = new Date();
          month = now.getMonth() + 1;
          year = now.getFullYear();
        }
        const overheadCosts = await getOverheadCostsByMonth(ctx.user!.id, month, year);
        
        // Calculate total overhead costs for the month
        let monthlyOverheadCosts = 0;
        if (overheadCosts) {
          monthlyOverheadCosts = 
            parseFloat(overheadCosts.rent?.toString() || '0') +
            parseFloat(overheadCosts.salaries?.toString() || '0') +
            parseFloat(overheadCosts.electricity?.toString() || '0') +
            parseFloat(overheadCosts.others?.toString() || '0');
        }
        
        let startDate = input.startDate ? new Date(input.startDate) : undefined;
        let endDate = input.endDate ? new Date(input.endDate) : undefined;
        
        const metrics = calculateDashboardMetrics(
          inventory, 
          sales, 
          undefined, 
          monthlyOverheadCosts, 
          input.durationDays,
          startDate,
          endDate
        );
        
        // Calculate previous month metrics for comparison
        let previousMetrics = null;
        if (startDate) {
          const prevMonthDate = new Date(startDate);
          prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
          const prevMonth = prevMonthDate.getMonth() + 1;
          const prevYear = prevMonthDate.getFullYear();
          
          // Get previous month overhead costs
          const prevOverheadCosts = await getOverheadCostsByMonth(ctx.user!.id, prevMonth, prevYear);
          let prevMonthlyOverheadCosts = 0;
          if (prevOverheadCosts) {
            prevMonthlyOverheadCosts = 
              parseFloat(prevOverheadCosts.rent?.toString() || '0') +
              parseFloat(prevOverheadCosts.salaries?.toString() || '0') +
              parseFloat(prevOverheadCosts.electricity?.toString() || '0') +
              parseFloat(prevOverheadCosts.others?.toString() || '0');
          }
          
          // Calculate date range for previous month
          const prevMonthStart = new Date(prevYear, prevMonth - 1, 1);
          const prevMonthEnd = new Date(prevYear, prevMonth, 0);
          prevMonthEnd.setHours(23, 59, 59, 999);
          
          previousMetrics = calculateDashboardMetrics(
            inventory,
            sales,
            undefined,
            prevMonthlyOverheadCosts,
            input.durationDays,
            prevMonthStart,
            prevMonthEnd
          );
        }
        
        return { success: true, data: metrics, previousMetrics };
      } catch (error) {
        console.error('Dashboard metrics error:', error);
        return { success: false, error: 'Failed to calculate metrics' };
      }
    }),

    getAlerts: protectedProcedure
      .input(z.object({ 
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        durationDays: z.number().optional().default(60) 
      }))
      .query(async ({ ctx, input }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        const alerts = identifyAlerts(
          inventory, 
          sales, 
          input.durationDays,
          input.startDate ? new Date(input.startDate) : undefined,
          input.endDate ? new Date(input.endDate) : undefined
        );
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

    getTotalProductsCount: protectedProcedure
      .input(z.object({ 
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
        try {
          const inventory = await getInventoryByUserId(ctx.user!.id);
          
          let filteredInventory = inventory;
          if (input.startDate && input.endDate) {
            const monthStart = new Date(input.startDate);
            const monthEnd = new Date(input.endDate);
            monthEnd.setHours(23, 59, 59, 999);
            
            filteredInventory = inventory.filter(item => {
              const createdDate = new Date(item.createdAt);
              return createdDate >= monthStart && createdDate <= monthEnd;
            });
          }
          
          const uniqueSkus = new Set(filteredInventory.map(item => item.sku));
          return { success: true, data: uniqueSkus.size };
        } catch (error) {
          console.error('Total products count error:', error);
          return { success: false, error: 'Failed to fetch total products count' };
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

    getKeyInsights: protectedProcedure
      .input(z.object({ 
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }))
      .query(async ({ ctx, input }) => {
      try {
        const inventory = await getInventoryByUserId(ctx.user!.id);
        const sales = await getSalesTransactionsByUserId(ctx.user!.id);
        
        let filteredInventory = inventory;
        let filteredSales = sales;
        
        if (input.startDate && input.endDate) {
          const monthStart = new Date(input.startDate);
          const monthEnd = new Date(input.endDate);
          monthEnd.setHours(23, 59, 59, 999);
          
          filteredInventory = inventory.filter(item => {
            const createdDate = new Date(item.createdAt);
            return createdDate >= monthStart && createdDate <= monthEnd;
          });
          
          filteredSales = sales.filter(s => {
            const createdDate = new Date(s.createdAt);
            return createdDate >= monthStart && createdDate <= monthEnd;
          });
        }
        
        const metrics = calculateDashboardMetrics(filteredInventory, filteredSales);
        const alerts = identifyAlerts(filteredInventory, filteredSales);
        const insights = generateKeyInsights(metrics, alerts, filteredInventory, filteredSales);
        return { success: true, data: insights };
      } catch (error) {
        console.error('Key insights error:', error);
        return { success: false, error: 'Failed to generate key insights' };
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
          const result = await upsertOverheadCosts({
            userId: ctx.user!.id,
            month: input.month,
            year: input.year,
            rent: input.rent.toString(),
            salaries: input.salaries.toString(),
            electricity: input.electricity.toString(),
            others: input.others.toString(),
          } as any);
          if (!result) {
            throw new Error('Failed to save overhead costs');
          }
          return { success: true, message: 'Overhead costs saved successfully' };
        } catch (error) {
          console.error('Error saving overhead costs:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to save overhead costs',
          });
        }
      }),
  }),

  // Monthly metrics management
  monthlyMetrics: router({
    getByMonth: protectedProcedure
      .input(z.object({ month: z.number().min(1).max(12), year: z.number() }))
      .query(async ({ ctx, input }) => {
        const data = await getMonthlyMetricsByMonth(ctx.user!.id, input.month, input.year);
        return { success: true, data: data || { totalRevenue: 0, estimatedProfit: 0, expiryRiskLoss: 0, deadStockValue: 0 } };
      }),

    save: protectedProcedure
      .input(
        z.object({
          month: z.number().min(1).max(12),
          year: z.number(),
          totalRevenue: z.number().min(0),
          estimatedProfit: z.number(),
          expiryRiskLoss: z.number().min(0),
          deadStockValue: z.number().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          await upsertMonthlyMetrics({
            userId: ctx.user!.id,
            month: input.month,
            year: input.year,
            totalRevenue: input.totalRevenue.toString(),
            estimatedProfit: input.estimatedProfit.toString(),
            expiryRiskLoss: input.expiryRiskLoss.toString(),
            deadStockValue: input.deadStockValue.toString(),
          } as any);
          return { success: true, message: 'Monthly metrics saved successfully' };
        } catch (error) {
          console.error('Error saving monthly metrics:', error);
          return { success: false, error: 'Failed to save monthly metrics' };
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

    removeDuplicates: protectedProcedure
      .mutation(async ({ ctx }) => {
        try {
          const result = await removeDuplicateInventory(ctx.user!.id);
          return { success: true, message: `Removed ${result.removed} duplicate entries`, removed: result.removed };
        } catch (error) {
          console.error('Error removing duplicates:', error);
          return { success: false, error: 'Failed to remove duplicates' };
        }
      }),
    clearAll: protectedProcedure
      .input(z.object({ month: z.number().optional(), year: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await clearAllUserData(ctx.user!.id, input.month, input.year);
          return { success: true, message: 'All data cleared successfully' };
        } catch (error) {
          console.error('Error clearing user data:', error);
          return { success: false, error: 'Failed to clear data' };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
