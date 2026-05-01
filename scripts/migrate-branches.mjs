#!/usr/bin/env node
/**
 * Migration script to apply multi-branch schema changes
 * Run with: node scripts/migrate-branches.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

async function runMigrations() {
  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: { rejectUnauthorized: true },
    };

    console.log(`Connecting to database: ${config.database}@${config.host}`);
    connection = await mysql.createConnection(config);

    const migrations = [
      // Add branchId columns to existing tables
      'ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branchId INT',
      'ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS branchId INT',
      'ALTER TABLE overhead_costs ADD COLUMN IF NOT EXISTS branchId INT',

      // Create user_types table
      `CREATE TABLE IF NOT EXISTS user_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        type ENUM('organization_owner', 'single_pharmacy') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Create organizations table
      `CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ownerId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Create branches table
      `CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organizationId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        managerName VARCHAR(255),
        managerPhone VARCHAR(20),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Create branch_users table
      `CREATE TABLE IF NOT EXISTS branch_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        branchId INT NOT NULL,
        role ENUM('owner', 'manager', 'staff', 'viewer') DEFAULT 'staff',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    ];

    for (const migration of migrations) {
      try {
        console.log(`Executing: ${migration.substring(0, 60)}...`);
        await connection.execute(migration);
        console.log('✓ Success');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⊘ Already exists (skipped)');
        } else {
          console.error('✗ Error:', error.message);
          throw error;
        }
      }
    }

    console.log('\n✓ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
