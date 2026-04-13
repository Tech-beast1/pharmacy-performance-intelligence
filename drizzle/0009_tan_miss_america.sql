ALTER TABLE `inventory` MODIFY COLUMN `uploadMonth` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `inventory` MODIFY COLUMN `uploadYear` int NOT NULL DEFAULT 2026;--> statement-breakpoint
ALTER TABLE `sales_transactions` MODIFY COLUMN `uploadMonth` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sales_transactions` MODIFY COLUMN `uploadYear` int NOT NULL DEFAULT 2026;