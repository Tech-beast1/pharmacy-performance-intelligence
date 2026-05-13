CREATE TABLE `monthly_profit_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`branchId` int,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`grossProfit` decimal(15,2) NOT NULL DEFAULT '0',
	`netProfit` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_profit_history_id` PRIMARY KEY(`id`)
);
