-- SQL Script to Remove Duplicate Inventory Products
-- This script keeps the most recent entry for each product (by userId + sku)
-- and deletes all older duplicates

-- Step 1: Identify duplicates and find the IDs to keep
-- For each userId + sku combination, keep the one with the latest updatedAt
-- Delete all others

DELETE FROM inventory
WHERE id NOT IN (
  SELECT max_id FROM (
    SELECT MAX(id) as max_id
    FROM inventory
    WHERE sku IS NOT NULL
    GROUP BY userId, sku
  ) AS keep_ids
)
AND sku IS NOT NULL;

-- Step 2: Also handle products with NULL SKU
-- For products without SKU, group by userId + productName
DELETE FROM inventory
WHERE id NOT IN (
  SELECT max_id FROM (
    SELECT MAX(id) as max_id
    FROM inventory
    WHERE sku IS NULL
    GROUP BY userId, productName
  ) AS keep_ids_null
)
AND sku IS NULL;
