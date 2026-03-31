CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inventoryId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`alertType` enum('expiry_risk','dead_stock','low_margin') NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'info',
	`value` decimal(15,2),
	`message` text,
	`isResolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`rowsProcessed` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `file_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`sku` varchar(100),
	`quantity` int NOT NULL DEFAULT 0,
	`price` decimal(10,2) NOT NULL,
	`costPrice` decimal(10,2),
	`expiryDate` date,
	`lastSaleDate` timestamp,
	`totalSalesQuantity` int NOT NULL DEFAULT 0,
	`totalSalesValue` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inventoryId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantitySold` int NOT NULL,
	`salePrice` decimal(10,2) NOT NULL,
	`totalSaleValue` decimal(15,2) NOT NULL,
	`costPrice` decimal(10,2),
	`profit` decimal(15,2),
	`saleDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_transactions_id` PRIMARY KEY(`id`)
);
