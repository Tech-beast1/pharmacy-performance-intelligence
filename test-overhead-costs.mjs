import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'pharmacy.db');

const db = new Database(dbPath);

// Get the current user ID (assuming first user in the database)
const user = db.prepare('SELECT id FROM users LIMIT 1').get();
if (!user) {
  console.error('No user found in database');
  process.exit(1);
}

const userId = user.id;
console.log(`Using user ID: ${userId}`);

// Get the first branch
const branch = db.prepare('SELECT id FROM branches WHERE user_id = ? LIMIT 1').get(userId);
if (!branch) {
  console.error('No branch found for user');
  process.exit(1);
}

const branchId = branch.id;
console.log(`Using branch ID: ${branchId}`);

// Add sample sales data for May 2026
const now = Date.now();
const month = 5;
const year = 2026;

try {
  // Insert sample sales transactions
  const insertSales = db.prepare(`
    INSERT INTO sales (user_id, branch_id, product_name, quantity, unit_cost, selling_price, month, year, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const salesData = [
    ['Paracetamol 500mg', 100, 0.50, 1.00, month, year, now],
    ['Amoxicillin 500mg', 50, 1.00, 2.50, month, year, now],
    ['Ibuprofen 400mg', 80, 0.75, 1.50, month, year, now],
    ['Metformin 500mg', 60, 0.60, 1.20, month, year, now],
    ['Vitamin C 1000mg', 120, 0.40, 0.80, month, year, now],
  ];

  let totalRevenue = 0;
  let totalCost = 0;

  for (const [product, qty, cost, price] of salesData) {
    insertSales.run(userId, branchId, product, qty, cost, price, month, year, now);
    totalRevenue += qty * price;
    totalCost += qty * cost;
  }

  console.log(`✅ Added ${salesData.length} sales transactions`);
  console.log(`   Total Revenue: ₵${totalRevenue.toFixed(2)}`);
  console.log(`   Total Cost: ₵${totalCost.toFixed(2)}`);
  console.log(`   Gross Profit: ₵${(totalRevenue - totalCost).toFixed(2)}`);

  // Add sample inventory data
  const insertInventory = db.prepare(`
    INSERT INTO inventory (user_id, branch_id, product_name, quantity, unit_cost, month, year, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inventoryData = [
    ['Paracetamol 500mg', 50, 0.50, month, year, now],
    ['Amoxicillin 500mg', 30, 1.00, month, year, now],
    ['Ibuprofen 400mg', 40, 0.75, month, year, now],
  ];

  for (const [product, qty, cost] of inventoryData) {
    insertInventory.run(userId, branchId, product, qty, cost, month, year, now);
  }

  console.log(`✅ Added ${inventoryData.length} inventory items`);

  console.log('\n✅ Test data added successfully!');
  console.log('Now go to the Dashboard to see the metrics update.');
  console.log('Then save overhead costs and verify the profit changes.');

} catch (error) {
  console.error('Error adding test data:', error);
  process.exit(1);
} finally {
  db.close();
}
