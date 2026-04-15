import mysql from 'mysql2/promise';

async function checkDuplicates() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port ? parseInt(url.port) : 3306,
      ssl: {},
    });

    console.log('Checking for duplicate product names...\n');

    // Find products with same name but different SKU
    const sql = `
      SELECT productName, COUNT(*) as count, GROUP_CONCAT(DISTINCT sku) as skus
      FROM inventory
      GROUP BY productName
      HAVING count > 1
      ORDER BY count DESC
    `;

    const [rows] = await connection.execute(sql);
    
    if (rows.length === 0) {
      console.log('No duplicate product names found.');
    } else {
      console.log(`Found ${rows.length} products with duplicates:\n`);
      rows.forEach(row => {
        console.log(`Product: ${row.productName}`);
        console.log(`  Count: ${row.count}`);
        console.log(`  SKUs: ${row.skus}\n`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDuplicates();
