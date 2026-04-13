CREATE TABLE `monthly_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalRevenue` decimal(15,2) NOT NULL DEFAULT '0',
	`estimatedProfit` decimal(15,2) NOT NULL DEFAULT '0',
	`expiryRiskLoss` decimal(15,2) NOT NULL DEFAULT '0',
	`deadStockValue` decimal(15,2) NOT NULL DEFAULT '0',
	`month` int NOT NULL,
	`year` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_metrics_id` PRIMARY KEY(`id`)
);
