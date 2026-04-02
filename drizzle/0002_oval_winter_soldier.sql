CREATE TABLE `overhead_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rent` decimal(12,2) NOT NULL DEFAULT '0',
	`salaries` decimal(12,2) NOT NULL DEFAULT '0',
	`electricity` decimal(12,2) NOT NULL DEFAULT '0',
	`others` decimal(12,2) NOT NULL DEFAULT '0',
	`month` int NOT NULL,
	`year` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `overhead_costs_id` PRIMARY KEY(`id`)
);
