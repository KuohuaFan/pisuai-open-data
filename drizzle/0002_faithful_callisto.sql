CREATE TABLE `government_catalog_syncs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mode` enum('full','delta') NOT NULL,
	`status` enum('running','succeeded','failed','skipped') NOT NULL,
	`reportDate` varchar(10),
	`recordsSeen` int NOT NULL DEFAULT 0,
	`recordsChanged` int NOT NULL DEFAULT 0,
	`snapshotSha256` varchar(64),
	`message` text,
	`startedAt` bigint NOT NULL,
	`finishedAt` bigint,
	CONSTRAINT `government_catalog_syncs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `government_datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` varchar(40) NOT NULL,
	`title` varchar(500) NOT NULL,
	`dataProperty` varchar(80),
	`serviceCategory` varchar(100) NOT NULL,
	`quality` varchar(40),
	`formats` text,
	`downloadUrls` text,
	`encodings` varchar(240),
	`publicationMethod` varchar(120),
	`description` text,
	`fieldDescription` text,
	`publisher` varchar(240) NOT NULL,
	`updateFrequency` varchar(120),
	`license` varchar(200),
	`relatedUrl` text,
	`cost` varchar(80),
	`issuedAt` bigint,
	`modifiedAt` bigint,
	`notes` text,
	`recordCountText` varchar(120),
	`status` enum('active','withdrawn') NOT NULL DEFAULT 'active',
	`rawHash` varchar(64) NOT NULL,
	`firstSeenAt` bigint NOT NULL,
	`lastSeenAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `government_datasets_id` PRIMARY KEY(`id`),
	CONSTRAINT `government_datasets_dataset_id_uq` UNIQUE(`datasetId`)
);
--> statement-breakpoint
CREATE INDEX `government_catalog_syncs_started_idx` ON `government_catalog_syncs` (`startedAt`);--> statement-breakpoint
CREATE INDEX `government_datasets_category_idx` ON `government_datasets` (`serviceCategory`);--> statement-breakpoint
CREATE INDEX `government_datasets_publisher_idx` ON `government_datasets` (`publisher`);--> statement-breakpoint
CREATE INDEX `government_datasets_modified_idx` ON `government_datasets` (`modifiedAt`);--> statement-breakpoint
CREATE INDEX `government_datasets_status_idx` ON `government_datasets` (`status`);