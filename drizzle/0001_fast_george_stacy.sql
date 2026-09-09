CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`details` text,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(80) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`cronExpression` varchar(80) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`model` varchar(100) NOT NULL DEFAULT 'gpt-5-mini',
	`promptVersion` varchar(40) NOT NULL DEFAULT 'v1.0',
	`lastRunAt` bigint,
	`lastResult` text,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `automation_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_key_uq` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int,
	`trigger` enum('manual','scheduled','webhook') NOT NULL,
	`status` enum('queued','running','succeeded','failed','skipped') NOT NULL,
	`recordsSeen` int NOT NULL DEFAULT 0,
	`recordsChanged` int NOT NULL DEFAULT 0,
	`rawSha256` varchar(64),
	`message` text,
	`startedAt` bigint NOT NULL,
	`finishedAt` bigint,
	CONSTRAINT `ingestion_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `report_bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_bookmark_uq` UNIQUE(`userId`,`reportId`)
);
--> statement-breakpoint
CREATE TABLE `report_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`sourceId` int NOT NULL,
	`evidenceUrl` text,
	`note` text,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `report_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_source_uq` UNIQUE(`reportId`,`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(300) NOT NULL,
	`dek` text NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`topic` varchar(100) NOT NULL,
	`status` enum('draft','review','published','withdrawn') NOT NULL DEFAULT 'draft',
	`sourceCount` int NOT NULL DEFAULT 0,
	`readingMinutes` int NOT NULL DEFAULT 5,
	`generatedBy` varchar(80) NOT NULL DEFAULT 'editorial',
	`model` varchar(100),
	`promptVersion` varchar(40),
	`reviewNote` text,
	`createdBy` int,
	`publishedAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `source_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceId` int NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `source_bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_bookmark_uq` UNIQUE(`userId`,`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(240) NOT NULL,
	`provider` varchar(200) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`sourceUrl` text NOT NULL,
	`repoUrl` text,
	`accessType` varchar(60) NOT NULL,
	`codeLicense` varchar(120),
	`dataLicense` varchar(180),
	`rightsClass` enum('A','B','C','D','MIXED') NOT NULL DEFAULT 'C',
	`status` enum('active','review','paused','withdrawn') NOT NULL DEFAULT 'review',
	`isPublic` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`updateCadence` varchar(120),
	`commitSha` varchar(64),
	`recordCount` int NOT NULL DEFAULT 0,
	`riskNote` text,
	`attribution` text,
	`lastVerifiedAt` bigint,
	`lastDataAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `sources_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `automation_task_uid_idx` ON `automation_configs` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `ingestion_runs_started_idx` ON `ingestion_runs` (`startedAt`);--> statement-breakpoint
CREATE INDEX `report_source_report_idx` ON `report_sources` (`reportId`);--> statement-breakpoint
CREATE INDEX `reports_status_published_idx` ON `reports` (`status`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `sources_public_status_idx` ON `sources` (`isPublic`,`status`);--> statement-breakpoint
CREATE INDEX `sources_category_idx` ON `sources` (`category`);--> statement-breakpoint
CREATE INDEX `sources_rights_idx` ON `sources` (`rightsClass`);