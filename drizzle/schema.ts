import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Inventory table stores product information.
 * Each product can have multiple sales transactions.
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  quantity: int("quantity").default(0).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }),
  expiryDate: date("expiryDate"),
  lastSaleDate: timestamp("lastSaleDate"),
  totalSalesQuantity: int("totalSalesQuantity").default(0).notNull(),
  totalSalesValue: decimal("totalSalesValue", { precision: 15, scale: 2 }).default("0").notNull(),
  qtySold30days: int("qtySold30days").default(0).notNull(),
  qtySold60days: int("qtySold60days").default(0).notNull(),
  qtySold90days: int("qtySold90days").default(0).notNull(),
  qtySold120days: int("qtySold120days").default(0).notNull(),
  stockValue: decimal("stockValue", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Sales_Transactions table stores individual sales records.
 * Each transaction references an inventory item.
 */
export const salesTransactions = mysqlTable("sales_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inventoryId: int("inventoryId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantitySold: int("quantitySold").notNull(),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }).notNull(),
  totalSaleValue: decimal("totalSaleValue", { precision: 15, scale: 2 }).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 15, scale: 2 }).notNull(),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }),
  profit: decimal("profit", { precision: 15, scale: 2 }),
  saleDate: timestamp("saleDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesTransaction = typeof salesTransactions.$inferSelect;
export type InsertSalesTransaction = typeof salesTransactions.$inferInsert;

/**
 * Alerts table stores alert records for expiry risk, dead stock, and low margin products.
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inventoryId: int("inventoryId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", ["expiry_risk", "dead_stock", "low_margin"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).default("info").notNull(),
  value: decimal("value", { precision: 15, scale: 2 }),
  message: text("message"),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * FileUploads table tracks all file uploads for audit and data lineage.
 */
export const fileUploads = mysqlTable("file_uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(),
  rowsProcessed: int("rowsProcessed").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;

/**
 * OverheadCosts table stores operational costs for the pharmacy.
 * Includes Rent, Salaries, Electricity, and Other costs.
 */
export const overheadCosts = mysqlTable("overhead_costs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rent: decimal("rent", { precision: 12, scale: 2 }).default("0").notNull(),
  salaries: decimal("salaries", { precision: 12, scale: 2 }).default("0").notNull(),
  electricity: decimal("electricity", { precision: 12, scale: 2 }).default("0").notNull(),
  others: decimal("others", { precision: 12, scale: 2 }).default("0").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OverheadCost = typeof overheadCosts.$inferSelect;
export type InsertOverheadCost = typeof overheadCosts.$inferInsert;

/**
 * PharmacyProfile table stores pharmacy information and setup details.
 * One profile per user/pharmacy.
 */
export const pharmacyProfiles = mysqlTable("pharmacy_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  pharmacyName: varchar("pharmacyName", { length: 255 }).notNull(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  setupDate: date("setupDate").notNull(),
  reportStartDate: date("reportStartDate"),
  reportEndDate: date("reportEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PharmacyProfile = typeof pharmacyProfiles.$inferSelect;
export type InsertPharmacyProfile = typeof pharmacyProfiles.$inferInsert;
