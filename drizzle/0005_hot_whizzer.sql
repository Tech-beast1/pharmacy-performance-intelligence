ALTER TABLE `inventory` ADD `qtySold30days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory` ADD `qtySold60days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory` ADD `qtySold90days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory` ADD `qtySold120days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory` ADD `stockValue` decimal(15,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_transactions` ADD `totalRevenue` decimal(15,2) NOT NULL;