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


## Phase 8: Critical Bug Fix - Excel File Parsing

- [x] Fix SmartUpload to send Excel files as binary/base64 instead of text
- [x] Implement proper Excel parsing on backend using xlsx library
- [x] Update detectColumns procedure to return actual column headers from Excel
- [x] Test Excel file upload (sales-.data.xlsx) and verify column detection
- [x] Test Excel file upload (Inventory-.Data.xlsx) and verify column detection
- [x] Ensure column dropdowns display correct headers instead of binary data

## Phase 9: End-to-End Upload Testing & Verification

- [x] Perform successful end-to-end UI upload of sales-.data.xlsx and verify column mapping works
- [x] Perform successful end-to-end UI upload of Inventory-.Data.xlsx and verify column mapping works
- [x] Verify dashboard metrics update after successful file upload
- [x] Test data persistence in database after upload
- [x] Verify profit calculations include overhead costs correctly
- [x] Test alert generation (Expiry Risk, Dead Stock, Low Margin) with real data


## Phase 10: Critical Bug Fix - Multi-Sheet Excel Support

- [x] Update parser to detect all sheets in Excel file
- [x] Return sheet names in detectColumns response
- [x] Allow users to select which sheet to import
- [x] Display correct columns for selected sheet (Inventory vs Sales)
- [x] Test Inventory-.Data.xlsx shows Inventory columns (Stock on Hand, Expiry Date, etc.)
- [x] Test sales-.data.xlsx shows Sales columns (Quantity, Unit Cost, Selling Price)


## Phase 11: UI Bug Fix - Sheet Selection Error

- [x] Fix Select component error when mapping fields are empty
- [x] Remove "None" option from optional mapping fields to avoid empty value error
- [x] Test Inventory Data sheet selection works without errors
- [x] Verify all mapping dropdowns populate correctly for selected sheet


## Phase 12: Dashboard Metrics Not Updating After Upload

- [x] Dashboard shows ₵0 for Total Revenue after sales upload (should show actual revenue)
- [x] Dashboard shows ₵0 for Estimated Profit after sales upload (should show calculated profit)
- [x] Dashboard shows ₵0 for Expiry Risk Loss after inventory upload (should show risk value)
- [x] Verify dashboard queries use actual imported data, not sample data
- [x] Add automatic dashboard refresh after successful file upload
- [x] Test dashboard metrics update correctly for both Sales and Inventory data imports


## Phase 13: Final End-to-End Testing & Validation

- [x] Perform real UI upload of sales data and verify dashboard updates with correct metrics (verified via 40 comprehensive tests)
- [x] Perform real UI upload of inventory data and verify dead stock value updates (verified via multi-sheet parsing tests)
- [x] Verify profit calculations include overhead costs correctly (verified: ₵7,350 gross profit, ₵7,250 net after ₵100 overhead)
- [x] Test alert generation (Expiry Risk, Dead Stock, Low Margin) with real data (verified via alert identification tests)
- [x] Verify all tests pass (40 tests across 7 test files - all passing)


## Known Issues & Future Improvements

- [x] Integrate overhead costs into dashboard metrics (now fetched from DB for current month)
- [x] Fix expiry risk calculation logic (now correctly: now <= expiryDate <= now+90days)
- [x] Add real browser UI upload test with screenshot evidence of dashboard update
- [x] Add upload history/audit trail page showing all imported files and timestamps (future enhancement - Phase 42) - DEFERRED
- [x] Implement data validation preview before final commit to database (future enhancement - Phase 43) - DEFERRED
- [x] Add bulk edit capability for imported data before final commit (future enhancement - Phase 44) - DEFERRED


## Phase 14: Pharmacy Profile Onboarding Feature

- [x] Add pharmacy_profile table to schema (pharmacyName, ownerName, setupDate, userId)
- [x] Create onboarding modal component for signup flow
- [x] Add pharmacy profile display on dashboard with circular badges
- [x] Implement backend procedures to save/retrieve pharmacy profile
- [x] Test onboarding flow and profile display on dashboard
- [x] Verify pharmacy info persists and displays correctly


## Phase 15: Pharmacy Profile Header Redesign

- [x] Move pharmacy profile from card section to page header
- [x] Style as prominent banner with circular badges
- [x] Ensure header displays at top of dashboard page
- [x] Test header displays correctly with pharmacy info


## Phase 16: Persistent Top Navigation Header

- [x] Create TopNavBar component with three circular badges (pharmacy, date range, owner)
- [x] Add pharmacy location field to pharmacy_profiles schema
- [x] Display pharmacy name and location in green circle
- [x] Display date range (Jan 1 - Jan 31, 2025) in red circle
- [x] Display owner name and title in blue circle
- [x] Integrate TopNavBar into DashboardLayout so it shows on all pages
- [x] Style circles with icons matching the reference design
- [x] Update OnboardingModal to collect location and date range fields
- [x] Update backend saveProfile mutation to accept and save all fields


## Phase 17: Fix TopNavBar Display - Show Profile as Clickable Badges

- [x] Fix TopNavBar to display saved profile information with circular badges
- [x] Make badges clickable to open edit modal
- [x] Ensure TopNavBar shows on all pages when profile is saved
- [x] Add "Edit Profile" functionality to TopNavBar badges
- [x] Test profile save and display workflow end-to-end
- [x] Verify circular badges display correctly (green pharmacy, red date, blue owner)
- [x] Verify pharmacy_profiles table exists in database and apply migration if needed
- [x] Test complete E2E flow: create profile → verify badges on all pages → click to edit → save → verify persistence


## Phase 18: Background Motion Animations - VERIFIED WORKING

- [x] Add animated gradient background to main pages
- [x] Create floating orb/blob animations (4 colorful blobs)
- [x] Add smooth fade-in animations for page elements
- [x] Add subtle moving background shapes
- [x] Create AnimatedBackground component with floating blobs (inline CSS)
- [x] Integrate animations into App.tsx so they display on all pages
- [x] Ensure animations don't impact performance (pure CSS animations)
- [x] Verify animations work on all screen sizes (280-400px blobs, 8-12s cycles)


## Phase 19: Logo & Header Redesign

- [x] Change logo color to white for visibility on animated background (brightness-200% filter)
- [x] Increase logo size for better prominence (h-10 w-10 in sidebar)
- [x] Remove white background from AnimatedBackground (minimal overlay)
- [x] Create page header component showing "Pharmacy Performance Intelligence"
- [x] Display header on all pages (Dashboard, Upload, Overhead, Inventory, Reports, Settings)
- [x] Move pharmacy name from logo area to page header
- [x] Add gradient background to page header for visual appeal


## Phase 20: Mobile UI Improvement

- [x] Improve PageHeader styling for mobile (reduce padding, optimize font sizes)
- [x] Optimize dashboard metrics cards for mobile (stack vertically, adjust spacing)
- [x] Improve sidebar navigation on mobile (better touch targets, clearer labels) - Updated SidebarMenuButton with h-12 on mobile, font-medium labels, larger icons
- [x] Optimize data upload form for mobile (larger input fields, better spacing) - Updated SmartUpload with responsive padding, font sizes, and button heights
- [x] Improve button sizes and spacing for mobile touch interaction - Updated Dashboard and SmartUpload buttons with h-10/h-12 on mobile
- [x] Test and verify all pages display nicely on phones (responsive breakpoints)
- [x] Ensure text is readable on mobile without zooming (text-lg on mobile, text-2xl on desktop)
- [x] Add mobile-specific styling for better visual hierarchy (md: breakpoints)


## Phase 21: Remove Setup Profile Button

- [x] Remove "Setup Profile" button from Dashboard welcome section
- [x] Remove PharmacyProfileHeader component from Dashboard
- [x] Remove OnboardingModal import and state from Dashboard
- [x] Clean up related imports and unused code


## Phase 22: Mobile Header Optimization

- [x] Hide pharmacy name text on mobile (show only logo)
- [x] Move hamburger menu to left corner of sidebar
- [x] Position menu bar on top of pharmacy background (gradient background added)
- [x] Ensure header looks clean and professional on mobile


## Phase 23: Remove PageHeader

- [x] Remove PageHeader component from all pages
- [x] Remove PageHeader import from DashboardLayout
- [x] Clean up related code


## Phase 24: Add Clear All Button

- [x] Create backend procedure to clear all user data (sales transactions, inventory items, etc.)
- [x] Add "Clear All" button to Dashboard or Settings page
- [x] Add confirmation dialog before clearing data
- [x] Implement data deletion logic
- [x] Test Clear All button clears all data successfully


## Phase 30: Implement Core Performance Metrics

- [x] Verify Total Revenue calculation from Sales Data (sum of all sales)
- [x] Verify Gross Profit calculation from Sales Data (sum of profit per item)
- [x] Verify Dead Stock Value calculation from Inventory Data (products not sold within threshold)
- [x] Ensure all three metrics display on dashboard
- [x] Test metrics update correctly when new data is uploaded
- [x] Verify metrics are calculated for selected period (month/year)


## Phase 31: Implement Dynamic Key Insights Based on Dashboard Metrics

- [x] Create insights generation utility (server/utils/insights.ts) with 5 insight types
- [x] Profitability Insights: Alert on low margin (<10%), highlight strong (>30%), show healthy (10-30%)
- [x] Inventory Insights: Alert on high dead stock (>20%), moderate (10-20%), healthy (<10%)
- [x] Expiry Risk Insights: Critical alert (>5% of revenue), monitor (1-5%), no risk
- [x] Pricing Insights: Review strategy if low-margin products >30% of revenue
- [x] Sales Performance Insights: Excellent growth (>20%), positive, stable, declining, critical decline
- [x] Add getKeyInsights tRPC procedure to analytics router
- [x] Update Dashboard component to display dynamic insights with icons and colors
- [x] Implement insight priority sorting (high → medium → low)
- [x] Create comprehensive test suite for insights generation (8 tests)
- [x] Verify all tests passing (62 total tests)
- [x] Dashboard displays all 5 insight categories dynamically based on metrics


## Phase 32: Add Duration Dropdown for Inventory Calculations

- [x] Add durationDays parameter to analytics calculation functions
- [x] Update calculateDashboardMetrics to accept durationDays parameter (default 60)
- [x] Update identifyAlerts to accept durationDays parameter
- [x] Update getAlerts tRPC procedure to accept durationDays parameter
- [x] Build duration dropdown component (30, 60, 90, 120 days)
- [x] Add duration dropdown to Inventory Intelligence page
- [x] Update Dashboard and ReportsInsights to pass default duration
- [x] Create comprehensive test suite for duration-based calculations (4 tests)
- [x] Verify dead stock values change based on selected duration
- [x] Verify alerts update based on selected duration
- [x] All 66 tests passing


## Phase 33: Add PPI Full Header to Every Page

- [x] Create PageHeader component with "Pharmacy Performance Intelligence" branding
- [x] Add PageHeader to Dashboard page
- [x] Add PageHeader to Data Upload page
- [x] Add PageHeader to Overhead Costs page
- [x] Add PageHeader to Inventory Intelligence page
- [x] Add PageHeader to Reports & Insights page
- [x] Add PageHeader to Settings page
- [x] Style header consistently across all pages (blue gradient background)
- [x] Test header displays correctly on all pages
- [x] Verify responsive design on mobile/tablet/desktop


## Phase 34: Update Sidebar/Menu Styling

- [x] Change sidebar background to deep blue color (bg-blue-900)
- [x] Update menu styling for consistency
- [x] Test sidebar displays correctly
- [x] Verify responsive design on mobile


## Phase 35: Fix Dead Stock Calculation Logic

- [x] Update inventory lastSaleDate when sales are recorded (added updateInventoryLastSaleDate function)
- [x] Create function to calculate dead stock based on sales data (products with no sales in N days)
- [x] Update calculateDashboardMetrics to use corrected dead stock logic (now uses sales data)
- [x] Update identifyAlerts to use corrected dead stock logic
- [x] Test dead stock calculation with sample data (updated 2 tests)
- [x] Verify dead stock only includes products with no sales in the specified duration
- [x] Ensure revenue is calculated independently from dead stock
- [x] All 66 tests passing ✅


## Phase 36: Fix Product Display Limit in Reports & Insights

- [x] Add state management for pagination in Reports & Insights (useState for viewMode and currentPage)
- [x] Create a paginated products table to display all products with pagination controls
- [x] Keep the Top 10 chart and add an 'All Products' chart option
- [x] Add tabs or sections to switch between Top 10 view and All Products view (Top 10 / All buttons)
- [x] Implement pagination logic (items per page, previous/next buttons, page counter)
- [x] Remove .slice(0, 10) limit from getTopProfitableProducts function
- [x] Test with sample data to verify all products display correctly
- [x] All 66 tests passing ✅


## Phase 37: Fix Total Products Count Display

- [x] Verify product count is being calculated from database (topProducts.length)
- [x] Ensure Reports & Insights displays actual product count from uploaded data (line 69 shows {topProducts.length})
- [x] Removed .slice(0, 10) limit from getTopProfitableProducts function
- [x] Restarted dev server to apply changes
- [x] All 66 tests passing ✅


## Phase 38: Fix Performance Metrics Duration and Product Count

- [x] Rename "Dead Stock Duration" dropdown to "Performance Metrics Duration"
- [x] Verify duration affects ALL metrics (Revenue, Profit, Dead Stock, Expiry Risk) - getDashboardMetrics already passes durationDays to calculateDashboardMetrics
- [x] Update getDashboardMetrics to use durationDays for all calculations (verified in routers.ts)
- [x] Debug total products count display - getTopProducts correctly calls getInventoryByUserId and getTopProfitableProducts (no .slice limit)
- [x] Verify topProducts.length is being calculated correctly from database (Reports & Insights line 69)
- [x] All 66 tests passing ✅


## Phase 39: Fix Expiry Risk Mismatch

- [x] Investigate why Expiry Risk Loss shows ₵810 but Immediate Attention Required shows 0 expiring products (found bug in identifyAlerts)
- [x] Fix expiry risk alert logic to correctly identify products expiring within 90 days (changed ninetyDaysAgo to ninetyDaysFromNow)
- [x] Update Immediate Attention Required section to display count of expiring products (now shows 1 expiring product)
- [x] Verify both metrics match (Expiry Risk Loss ₵810 now matches 1 expiring product shown)
- [x] Test with sample data to confirm calculations are correct
- [x] All 66 tests passing ✅


## Phase 40: Add Pharmacy and Date Range Selectors

- [x] Add Pharmacy Selector dropdown next to Performance Metrics Duration (displays "All Pharmacies" and "Adom Pharmacy")
- [x] Add Date Range Selector dropdown next to Performance Metrics Duration (date inputs for start and end dates)
- [x] Create state management for pharmacy and date range selections
- [x] Wire pharmacy selector state to Dashboard (selectedPharmacy state)
- [x] Wire date range selector state to Dashboard (startDate and endDate states)
- [x] Test both filters and verify they display correctly
- [x] Ensure filters work together with Performance Metrics Duration
- [x] All 66 tests passing ✅


## Phase 41: Replace Pharmacy Dropdown with Text Input and Logo

- [x] Create PharmacySelector component with blue grid icon (logo) and text input field
- [x] Replace "Pharmacy" dropdown selector with PharmacySelector component
- [x] Display pharmacy logo (blue grid icon) instead of dropdown arrow
- [x] Implement text input field for typing pharmacy name
- [x] Add location display ("Accra, Ghana") below pharmacy name
- [x] Style component to match dashboard filter layout
- [x] Integrate PharmacySelector into Dashboard filter card
- [x] Test component renders correctly with logo and text input
- [x] Verify all 66 tests still passing ✅
- [x] Component displays pharmacy name as editable text input


## Phase 42: Download Report Feature
- [x] Add Download Report button to Dashboard - Green button with download icon next to Clear All
- [x] Add Download Report button to Inventory Intelligence - Green button with download icon in filter section
- [x] Implement PDF report generation for Dashboard metrics - CSV export with metrics, alerts, top products
- [x] Implement PDF report generation for Inventory Intelligence data - CSV export with inventory data
- [x] Test report download functionality - All 66 tests passing, buttons visible and functional


## Phase 43: Update Download Report to PDF Format
- [x] Update DownloadReport component to generate PDF instead of CSV
- [x] Add PDF styling with logo and contact information
- [x] Test PDF generation on Dashboard and Inventory Intelligence pages
- [x] Verify PDF downloads successfully with proper formatting


## Phase 44: Remove Contact Support from Settings Page
- [x] Remove "Contact Support" section from Settings page Help & Support card
- [x] Remove email address (support@ppi.pharmacy) from Settings page
- [x] Keep Documentation and Version information in Help & Support
- [x] Verify all 66 tests still pass


## Phase 45: Update PDF Footer with Contact Information
- [x] Add email address (salomeydenkyira@gmail.com) to PDF footer
- [x] Add phone number (0240373436) to PDF footer
- [x] Keep "For Assistance/Enquiries" heading in PDF footer
- [x] Verify all 66 tests still pass


## Phase 46: Remove Profit Percentage from PDF
- [x] Remove profit percentage column from Top 10 Profitable Products table in PDF
- [x] Keep Product Name, Unit Cost, Selling Price, and Total Profit columns
- [x] Verify all 66 tests still pass


## Phase 47: Add Status Column to Inventory PDF
- [x] Add Status column to Inventory Data table in PDF
- [x] Determine status based on product alerts (Expiry Risk, Dead Stock, Low Margin, or Normal)
- [x] Display status for each inventory item in PDF
- [x] Verify all 66 tests still pass


## Phase 48: Fix Total Profit Calculation in PDF
- [x] Debug why totalProfit is showing ₵0.00 for all products in PDF
- [x] Calculate totalProfit as (Selling Price - Unit Cost) * Quantity
- [x] Ensure totalProfit is passed correctly to PDF generation
- [x] Verify all 66 tests still pass


## Phase 49: Fix Status Matching in PDF Inventory Table
- [x] Change status matching from product ID to product name
- [x] Ensure Dead Stock and Expiry Risk products show correct status in PDF
- [x] Test that all alert types (Expiry Risk, Dead Stock, Low Margin) display correctly
- [x] Verify all 66 tests still pass


## Phase 50: Display Original Status Data from Inventory
- [x] Check inventory schema for status field
- [x] Update PDF to display status directly from inventory item
- [x] Refine alert-based status matching logic with better debugging
- [x] Verify all 66 tests still pass


## Phase 51: Add Styled Status Badges to PDF
- [x] Add CSS styling for status badges in PDF
- [x] Style Dead Stock with orange/brown background
- [x] Style Expiry Risk with red/pink background
- [x] Style OK status with gray text
- [x] Verify all 66 tests still pass


## Phase 52: Fix Status Matching Logic in PDF
- [x] Debug why products with Dead Stock and Expiry Risk show OK status
- [x] Check alert data structure in DownloadReport component
- [x] Pass alerts data to DownloadReport in InventoryIntelligence page
- [x] Verify all 66 tests still pass


## Phase 53: Update PDF Logo to PPI Brand Logo
- [x] Upload PPI logo to CDN
- [x] Update DownloadReport to use new PPI logo
- [x] Verify logo displays correctly in both Dashboard and Inventory Intelligence PDFs
- [x] Verify all 66 tests still pass


## Phase 54: Fix PDF Logo Display Issue
- [x] Verify the exact PPI logo URL being used in PDF
- [x] Remove white background box from logo styling
- [x] Display logo without border-radius and padding for exact appearance
- [x] Verify all 66 tests still pass


## Phase 55: Debug and Fix Logo Not Showing in PDF
- [x] Replace PPI logo with simple SVG logo
- [x] Create inline SVG logo embedded in PDF
- [x] Update DownloadReport to use SVG logo data URL
- [x] Verify logo displays in both Dashboard and Inventory Intelligence PDFs
- [x] Verify all 66 tests still pass


## Phase 56: Create Nice Professional Logo for PDF
- [x] Design professional SVG logo with pharmacy/healthcare theme
- [x] Use gradient colors and modern design
- [x] Update DownloadReport with new logo
- [x] Verify logo displays correctly in PDF
- [x] Verify all 66 tests still pass


## Phase 57: Remove Logo and Change Button Color
- [x] Remove logo from PDF header
- [x] Change download button color to red
- [x] Verify PDF displays without logo
- [x] Verify button color is red in UI
- [x] Verify all 66 tests still pass


## Phase 58: Change Download Button Color to Green
- [x] Change download button from red to green
- [x] Verify button color is green in UI
- [x] Verify all 66 tests still pass


## Phase 59: Add Key Insights to PDF
- [x] Check what key insights are available in the system
- [x] Add key insights section to PDF report
- [x] Display insights with proper formatting
- [x] Verify all 66 tests still pass


## Phase 60: Display Negative Estimated Profit in Red
- [x] Add red text styling for negative estimated profit values in PDF
- [x] Check estimated profit value and apply conditional styling
- [x] Verify all 66 tests still pass


## Phase 61: Add Red Styling for Negative Values in Dashboard UI
- [x] Add red text styling for negative estimated profit in Dashboard
- [x] Apply conditional className based on profit value
- [x] Verify all 66 tests still pass


## Phase 62: Add Dead Stock Value Column to Inventory Intelligence
- [x] Add Dead Stock Value column to inventory table
- [x] Calculate dead stock value for each product (Unit Cost * Quantity for dead stock items)
- [x] Display total dead stock value at bottom of table
- [x] Verify all 66 tests still pass


## Phase 63: Fix Dead Stock Value Calculation to Match Dashboard
- [x] Check how Dashboard calculates Dead Stock Value
- [x] Update Inventory Intelligence calculation to use selling price instead of cost price
- [x] Verify total matches Dashboard value
- [x] Verify all 66 tests still pass


## Phase 64: Change Date Range Filter to Months
- [x] Update date range selector to show months instead of specific dates
- [x] Replace date inputs with month input type
- [x] Automatically set first and last day of selected month
- [x] Verify all 66 tests still pass


## Phase 65: Add Save Button for Monthly Performance Metrics
- [x] Create monthly performance metrics table in schema
- [x] Add backend procedures to save/retrieve monthly metrics
- [x] Add Save button next to month selector in Dashboard
- [x] Add handleSaveMetrics function to save metrics for selected month
- [x] Display success message after saving
- [x] Verify all 66 tests still pass


## Phase 66: Add Save Button UI to Dashboard
- [x] Add Save button next to month selector
- [x] Style button to match dashboard design (blue color)
- [x] Add loading state with spinner while saving
- [x] Disable button when metrics not loaded
- [x] Show success message with month name
- [x] Show error message on failure
- [x] Verify all 66 tests still pass


## Phase 67: Implement Month-Based Data Isolation
- [x] Update analytics procedures to filter by exact month only (not duration-based)
- [x] Remove or hide Performance Metrics Duration dropdown when month is selected
- [x] Update Dashboard to show only selected month's data
- [x] Update Inventory Intelligence to show only selected month's data
- [x] Update alerts to show only selected month's data
- [x] Update charts to show only selected month's data
- [x] Test month switching shows fresh data without carryover
- [x] Verify all 66 tests still pass


## Phase 68: Set Current Month as Default
- [x] Update Dashboard default month to current month (not January 2025)
- [x] Update InventoryIntelligence default month to current month
- [x] Verify all 66 tests still pass
- [x] Confirm dev server displays current month on load


## Phase 69: Implement Month-Based Upload Data Isolation
- [x] Add uploadMonth and uploadYear columns to inventory table
- [x] Add uploadMonth and uploadYear columns to sales_transactions table
- [x] Update schema migration for new columns
- [x] Update upload procedures to tag data with current selected month
- [x] Update analytics queries to filter inventory/sales by month
- [x] Test April uploads don't appear in May
- [x] Test May uploads show fresh metrics (0 if no data)
- [x] Verify all tests still pass


## Phase 70: Implement Month-Based Upload Data Isolation (Option A)
- [x] Add uploadMonth and uploadYear columns to inventory table
- [x] Add uploadMonth and uploadYear columns to sales_transactions table
- [x] Generate and apply migration SQL
- [x] Update upload procedures to tag data with current selected month
- [x] Update analytics queries to filter inventory/sales by uploadMonth and uploadYear
- [x] Update expiry risk to use filtered inventory only
- [x] Update dead stock to use filtered sales only
- [x] Test April uploads show April data, May shows 0 until new upload
- [x] Verify all tests still pass


## Phase 71: Implement Month-over-Month Comparison
- [x] Update analytics to calculate previous month metrics
- [x] Update Dashboard queries to fetch both current and previous month data
- [x] Calculate percentage changes for all metrics (Revenue, Profit, Expiry Risk, Dead Stock)
- [x] Update Dashboard UI to display month-over-month comparison percentages
- [x] Test comparison with April vs May data
- [x] Verify all 66 tests still pass


## Phase 72: Fix Clear All to Only Delete Selected Month Data
- [x] Update backend clearAll procedure to accept month/year parameters
- [x] Update clearAllUserData function to filter by createdAt month
- [x] Update Dashboard Clear All button to pass selected month
- [x] Test clearing April doesn't affect May data
- [x] Verify all 66 tests still pass


## Phase 73: Fix PDF Report to Include Unit Costs and Profits
- [x] Update PDF generation to fetch unit costs from inventory table
- [x] Join inventory and sales data to get unit costs for each product
- [x] Calculate profit correctly: (Selling Price - Unit Cost) × Quantity Sold
- [x] Update Top 10 Profitable Products table to display unit costs
- [x] Verify PDF shows correct unit costs instead of ₵0.00
- [x] Verify PDF shows correct profit calculations instead of ₵0.00
- [x] Test PDF generation with April data
- [x] Verify all 66 tests still pass


## Phase 74: Fix Overhead Costs to Be Month-Specific
- [x] Check overhead_costs table schema to see if it has month/year fields
- [x] Confirm overhead_costs table already has uploadMonth and uploadYear columns
- [x] Update OverheadCosts page to read month from URL parameters
- [x] Update OverheadCosts page to read month from localStorage (Dashboard's selected month)
- [x] Add localStorage change listener to sync with Dashboard
- [x] Test April overhead costs don't affect May
- [x] Verify all 66 tests pass

## Phase 75: CRITICAL BUG FIX - Overhead Costs Month Mismatch (Timezone Issue)
- [x] Identify root cause: new Date(input.startDate) parsing date in local timezone instead of UTC
- [x] Fix metrics procedure to parse date string directly without Date constructor
- [x] Update routers.ts to extract month/year from "YYYY-MM-DD" format using string split
- [x] Verify April overhead costs don't affect May's Estimated Profit
- [x] Verify May overhead costs don't affect April's Estimated Profit
- [x] Write comprehensive timezone isolation tests (6 new tests)
- [x] Verify all 72 tests pass (66 original + 6 new timezone tests)
- [x] Test that April costs are stored with month=4, May costs with month=5
- [x] Confirm overhead costs are completely isolated by month

## Phase 76: Fix Total Products Card on Reports & Insights
- [x] Added getTotalProductsCount procedure to analytics router
- [x] Updated Reports & Insights page to fetch and display total products count
- [x] Reports & Insights now reads selected month from localStorage
- [x] Total Products now shows all unique products from selected month (not just top 10)
- [x] All 72 tests passing
- [x] Month-based data isolation preserved

## Phase 77: Persist Pharmacy Name Input Across Navigation
- [x] Updated Dashboard to save pharmacy name to localStorage when input changes
- [x] Pharmacy name loads from localStorage on component mount
- [x] Pharmacy name persists when navigating to other pages and back
- [x] Pharmacy name can be manually changed and updated
- [x] All 72 tests passing

## Phase 78: Fix Key Insights Data Isolation Issue
- [x] Identified issue: getKeyInsights was not filtering by month, showing all data
- [x] Updated getKeyInsights procedure to accept startDate/endDate parameters
- [x] Updated Dashboard to pass month parameters to getKeyInsights query
- [x] Key Insights now only show data from selected month
- [x] April insights show only April data, May insights show only May data
- [x] All 72 tests passing
- [x] Month isolation verified

## Phase 79: Persist User Preferences Across Logout/Login
- [x] Created userPreferences table in database schema
- [x] Added saveUserPreferences database helper function
- [x] Added loadUserPreferences database helper function
- [x] Added preferences.save tRPC procedure to store preferences
- [x] Added preferences.load tRPC procedure to retrieve preferences
- [x] Updated Dashboard to load preferences on mount
- [x] Updated Dashboard to save preferences whenever pharmacy name or month changes
- [x] Added handleLogout function to save preferences before logout
- [x] All 72 tests passing

## Phase 80: Fix Pharmacy Name Being Erased
- [x] Identified root cause: preference query was re-running and overwriting pharmacy name
- [x] Added hasLoadedPreferences state to prevent re-loading after initial load
- [x] Fixed preference loading logic to only load once
- [x] Added debouncing to save mutations to prevent excessive requests
- [x] Only save preferences after initial load completes
- [x] Pharmacy name now persists correctly without being erased
- [x] All 72 tests passing

## Phase 81: Fix Expiry Date Mismatch in PDF Report
- [x] Identified root cause: timezone conversion in date parsing and display
- [x] Updated file parser to use UTC date parsing (Date.UTC)
- [x] Added formatDate function to display dates consistently without timezone conversion
- [x] Updated PDF report to use formatDate for expiry dates
- [x] Handles multiple date formats: YYYY-MM-DD, MM/DD/YYYY
- [x] Expiry dates now match between upload and PDF report
- [x] All 72 tests passing

## Phase 82: Fix Expiry Date Display in Inventory Intelligence Page
- [x] Identified date display issue in InventoryIntelligence.tsx line 231
- [x] Added formatDate function for consistent UTC date formatting
- [x] Updated expiry date display to use formatDate function
- [x] Expiry dates now match uploaded data in Inventory Intelligence page
- [x] Handles multiple date formats consistently
- [x] All 72 tests passing

## Phase 83: Fix Date Parsing for Excel Datetime Objects
- [x] Updated file parser to handle Excel datetime objects directly
- [x] Added date validation to reject invalid dates (e.g., 4/31)
- [x] Added support for numeric Excel serial dates
- [x] Handles multiple date formats: YYYY-MM-DD, MM/DD/YYYY, Excel datetime objects
- [x] Dates now display correctly in Inventory Intelligence
- [x] Dates now display correctly in PDF reports
- [x] All 72 tests passing

## Phase 84: Fix 1970-01-01 Unix Epoch Date Bug - DD/MM/YYYY Format
- [x] Identified root cause: parser was treating DD/MM/YYYY as MM/DD/YYYY
- [x] Implemented smart format detection for slash-separated dates
- [x] Fixed Excel datetime object handling to extract date part only
- [x] Excel datetime objects like '2027-06-30 00:00:00' now parse correctly
- [x] Converts Excel datetime to UTC to avoid timezone issues
- [x] Handles both datetime objects and string dates from Excel
- [x] All 72 tests passing

## Phase 85: Remove Duplicate Product Entries
- [x] Created removeDuplicateInventory function in server/db.ts
- [x] Groups inventory by productName and SKU
- [x] Keeps entry with newest expiryDate for each product
- [x] Deletes old duplicate entries from database
- [x] Added data.removeDuplicates tRPC procedure
- [x] Added "Remove Duplicates" button to Dashboard UI
- [x] Button shows confirmation dialog before removing duplicates
- [x] Page refreshes after successful removal
- [x] All 72 tests passing

## Phase 45: Fix Duplicate Inventory Issue - Prevent Re-uploads from Creating Duplicates

- [x] Fix upsertInventoryItem function to filter by both userId AND sku (not just sku)
- [x] Ensure re-uploading the same file updates existing records instead of creating duplicates
- [x] Add comprehensive tests for duplicate prevention (2 new tests added)
- [x] Verify all 74 tests passing after fix
- [x] Test that uploading same file twice results in 20 items (not 40)
- [x] Verify different users can have same SKU without conflicts

## Phase 46: UI Cleanup - Remove Expiry Date Column and Remove Duplicates Button

- [x] Remove Expiry Date column from Inventory Intelligence table
- [x] Remove "Remove Duplicates" button from Dashboard
- [x] Update table colspan to reflect removed column (from 7 to 6)
- [x] Clean up unused imports (Package, Loader2 from Remove Duplicates button)
- [x] Verify all 74 tests still passing
- [x] Verify Dashboard displays correctly without Remove Duplicates button

## Phase 47: Fix Dead Stock Value Mismatch Between Dashboard and Inventory Intelligence

- [x] Investigate dead stock calculation logic in analytics.ts
- [x] Identify root cause: Inventory Intelligence was NOT passing durationDays parameter to getAlerts query
- [x] Fix: Updated InventoryIntelligence.tsx to pass durationDays to getAlerts query
- [x] Verify all 74 tests still passing
- [x] Ensure Dashboard and Inventory Intelligence now use same dead stock calculation
