import mysql from 'mysql2/promise';

async function cleanup() {
  try {
    // Get database URL from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL environment variable not set');
      process.exit(1);
    }

    // Parse connection string
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port ? parseInt(url.port) : 3306,
      ssl: {}, // Empty object for SSL
    });

    console.log('Connected to database');

    // Execute cleanup SQL
    const sql1 = `
      DELETE FROM inventory
      WHERE id NOT IN (
        SELECT max_id FROM (
          SELECT MAX(id) as max_id
          FROM inventory
          WHERE sku IS NOT NULL
          GROUP BY userId, sku
        ) AS keep_ids
      )
      AND sku IS NOT NULL
    `;

    const sql2 = `
      DELETE FROM inventory
      WHERE id NOT IN (
        SELECT max_id FROM (
          SELECT MAX(id) as max_id
          FROM inventory
          WHERE sku IS NULL
          GROUP BY userId, productName
        ) AS keep_ids_null
      )
      AND sku IS NULL
    `;

    console.log('Executing cleanup SQL...');
    const [result1] = await connection.execute(sql1);
    console.log(`Deleted ${result1.affectedRows} duplicate products with SKU`);

    const [result2] = await connection.execute(sql2);
    console.log(`Deleted ${result2.affectedRows} duplicate products without SKU`);

    // Verify results
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM inventory');
    console.log(`Total products remaining: ${rows[0].total}`);

    await connection.end();
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
