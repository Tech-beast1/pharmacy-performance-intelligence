import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const migrationSQL = `CREATE TABLE IF NOT EXISTS \`user_preferences\` (
	\`id\` int AUTO_INCREMENT NOT NULL,
	\`userId\` int NOT NULL,
	\`pharmacyName\` varchar(255),
	\`selectedMonth\` varchar(7),
	\`selectedYear\` int,
	\`createdAt\` timestamp NOT NULL DEFAULT (now()),
	\`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT \`user_preferences_id\` PRIMARY KEY(\`id\`),
	CONSTRAINT \`user_preferences_userId_unique\` UNIQUE(\`userId\`)
);`;

async function runMigration() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Running migration: Creating user_preferences table...');
    await connection.execute(migrationSQL);
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
