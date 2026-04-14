import mysql from 'mysql2/promise';

const dbUrl = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  ssl: 'Amazon RDS',
});

const [rows] = await connection.execute(
  'SELECT productName, expiryDate FROM inventory WHERE productName LIKE "Amlodipine%" OR productName LIKE "Amoxicillin%" LIMIT 10'
);

console.log('Sample inventory dates:');
rows.forEach(row => {
  console.log(`${row.productName}: ${row.expiryDate}`);
});

await connection.end();
