# Pharmacy Performance Intelligence (PPI) - Project TODO

## Database & Backend
- [x] Design and implement database schema (Inventory, Sales_Transactions, Alerts tables)
- [x] Create tRPC procedures for file upload and parsing
- [x] Implement CSV/Excel parsing logic with column mapping
- [x] Build analytics calculation procedures (revenue, profit, trends, expiry risk, dead stock)
- [x] Create database query helpers for dashboard metrics
- [x] Implement cumulative data update logic (append/update on each upload)

## Smart Upload Feature
- [x] Build file upload zone component with drag-and-drop
- [x] Implement column-mapping UI to confirm Price, Quantity, Expiry Date fields
- [x] Add file validation (CSV/Excel format check)
- [x] Create data preview before confirmation
- [x] Implement upload progress indicator
- [x] Add success/error notifications

## Dashboard UI - Metric Cards
- [x] Build Total Revenue card with percentage trend
- [x] Build Estimated Profit card with percentage trend
- [x] Build Expiry Risk Loss card with percentage trend
- [x] Build Dead Stock Value card with percentage trend
- [x] Implement responsive grid layout (4x1 desktop, 1x4 mobile)

## Dashboard UI - Alerts Banner
- [x] Build "Immediate Attention Required" banner with alert cards
- [x] Implement Expiry Risk alert (red, products expiring in 90 days)
- [x] Implement Dead Stock alert (orange, products with 0 sales in 60 days)
- [x] Implement Low Margin Products alert
- [x] Make alerts clickable to filter data table

## Charts & Visualizations
- [x] Build Revenue vs Profit Trend chart (line chart with interactive hover)
- [x] Build Top 10 Profitable Products bar chart with margin percentages
- [x] Implement interactive tooltips for all charts

## Inventory Intelligence & Data Table
- [x] Build data table displaying all inventory items
- [x] Implement sortable columns (Product Name, Price, Quantity, Margin, Status)
- [x] Add alert status indicators (Expiry Risk, Dead Stock, Low Margin)
- [x] Implement filtering by alert status
- [x] Add pagination or infinite scroll

## Navigation & Layout
- [x] Build responsive sidebar navigation (desktop)
- [x] Implement hamburger menu for mobile (< 768px)
- [x] Create bottom navigation bar for mobile
- [x] Add Dashboard, Data Upload, Inventory Intelligence, Reports & Insights, Settings menu items
- [x] Implement user profile section with logout

## Settings & Additional Pages
- [x] Build Settings page with preferences
- [x] Build Reports & Insights page with key insights
- [x] Implement Help & Support section

## Logo & Visual Polish
- [x] Generate PPI logo with navy blue accent
- [x] Set up favicon and branding
- [x] Apply professional color scheme (navy blue, white, alert colors)
- [x] Ensure consistent typography and spacing
- [x] Test responsive design on mobile/tablet/desktop

## Testing & Delivery
- [x] Write vitest tests for backend procedures
- [x] Test file upload with sample CSV/Excel data
- [x] Verify dashboard calculations and trends
- [x] Test responsive layout on various screen sizes
- [x] Test alert filtering and data table interactions
- [x] Create sample data for demonstration
- [x] Final QA and bug fixes


## User Enhancement Requests (Phase 2)

- [x] Extract drug list from VICANCHEMISTSDRUGLIST.pdf and integrate into system
- [x] Increase logo size in header and replace "PPI" text with "Pharmacy Performance Intelligence"
- [x] Add Ghanaian Cedis (₵) currency formatting to all monetary values
- [x] Implement modern, professional color scheme (replace plain white background)
- [x] Add graph/chart session to dashboard (Revenue vs Profit Trend chart)
- [x] Ensure all file uploads immediately update all dashboard metrics and visualizations
- [x] Optimize dashboard responsiveness and visual hierarchy


## Phase 3: Overhead Costs & Advanced Features

- [x] Update database schema to add OverheadCosts table with Rent, Salaries, Electricity, Others fields
- [x] Create Overhead Costs management page with input form
- [x] Update CSV/Excel parser to support Sales data columns (Item Name, Quantity, Unit Cost, Selling Price)
- [x] Update CSV/Excel parser to support Inventory data columns (Item/Product Name, Unit Cost, Selling Cost, Stock on Hand, Expiry Date, Qty Sold 90days)
- [x] Update profit calculation formula: Profit = Selling Price - (Cost Price + Overhead Cost)
- [x] Add Download Report button to dashboard
- [x] Implement PDF/CSV export with all metrics and insights
- [x] Add Overhead Costs menu item to sidebar navigation
- [x] Test all new features end-to-end


## Phase 4: Bug Fixes & Critical Functionality

- [x] Reorder sidebar menu - move Overhead Costs right after Data Upload
- [x] Update Overhead Costs icon from Settings to Calculator/DollarSign
- [x] Replace Ghanaian Cedis symbol (₵) with proper logo throughout UI
- [x] Debug file upload functionality - ensure CSV/Excel files are properly read
- [x] Implement proper column detection for Sales data (Item Name, Quantity, Unit Cost, Selling Price)
- [x] Implement proper column detection for Inventory data (Item/Product Name, Unit Cost, Selling Cost, Stock on Hand, Expiry Date, Qty Sold 90days)
- [x] Verify dashboard updates with real data from uploaded files
- [x] Test upload with sample CSV and Excel files


## Phase 5: Final UI Refinements

- [x] Update Reports & Insights page to display currency in Ghanaian Cedis
- [x] Replace dollar sign icons in Overhead Costs page with appropriate icons (Rent, Salaries, Electricity, Others)
- [x] Add Data Analyst footer with clickable email and phone number
- [x] Test all changes and verify responsive design


## Phase 6: Performance & UX Optimization

- [x] Fix skeleton loading state - reduce blue placeholder display time
- [x] Optimize authentication check to prevent loading delay
- [x] Add progressive content rendering to improve perceived performance
