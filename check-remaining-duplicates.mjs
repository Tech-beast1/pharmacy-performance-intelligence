import mysql from 'mysql2/promise';

async function check() {
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

    const [products] = await connection.execute(`
      SELECT productName, COUNT(*) as count, userId
      FROM inventory
      GROUP BY userId, productName
      HAVING count > 1
    `);

    console.log('Remaining duplicates:\n');
    products.forEach(p => {
      console.log(`Product: ${p.productName}, UserId: ${p.userId}, Count: ${p.count}`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
