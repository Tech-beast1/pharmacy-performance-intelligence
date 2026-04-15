import mysql from 'mysql2/promise';

async function cleanup() {
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

    console.log('Removing duplicate products by product name...\n');

    // For each product name, keep only the most recent entry (by updatedAt)
    // and delete all older entries
    const sql = `
      DELETE FROM inventory
      WHERE id NOT IN (
        SELECT max_id FROM (
          SELECT MAX(id) as max_id
          FROM inventory
          GROUP BY userId, productName
        ) AS keep_ids
      )
    `;

    console.log('Executing cleanup SQL...');
    const [result] = await connection.execute(sql);
    console.log(`Deleted ${result.affectedRows} duplicate product entries`);

    // Verify results
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM inventory');
    console.log(`Total products remaining: ${rows[0].total}`);

    // Show remaining products
    const [products] = await connection.execute(`
      SELECT productName, COUNT(*) as count
      FROM inventory
      GROUP BY productName
      HAVING count > 1
    `);

    if (products.length === 0) {
      console.log('\n✓ No duplicate products remain!');
    } else {
      console.log(`\nWarning: Still have ${products.length} products with duplicates`);
    }

    await connection.end();
    console.log('\nCleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
