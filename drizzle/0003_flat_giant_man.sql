CREATE TABLE `pharmacy_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pharmacyName` varchar(255) NOT NULL,
	`ownerName` varchar(255) NOT NULL,
	`setupDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pharmacy_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `pharmacy_profiles_userId_unique` UNIQUE(`userId`)
);
