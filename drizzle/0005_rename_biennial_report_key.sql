-- When both keys exist, preserve the legacy task binding and run state on the
-- current row before removing the redundant legacy row.
UPDATE `automation_configs` AS `current`
INNER JOIN `automation_configs` AS `legacy`
  ON `current`.`key` = 'generate-report-draft'
 AND `legacy`.`key` = 'biennial-report'
SET `current`.`enabled` = (`current`.`enabled` OR `legacy`.`enabled`),
    `current`.`scheduleCronTaskUid` = COALESCE(`current`.`scheduleCronTaskUid`, `legacy`.`scheduleCronTaskUid`),
    `current`.`lastResult` = CASE
      WHEN `current`.`lastRunAt` IS NULL THEN `legacy`.`lastResult`
      WHEN `legacy`.`lastRunAt` IS NOT NULL AND `legacy`.`lastRunAt` > `current`.`lastRunAt`
        THEN `legacy`.`lastResult`
      ELSE `current`.`lastResult`
    END,
    `current`.`lastRunAt` = CASE
      WHEN `current`.`lastRunAt` IS NULL THEN `legacy`.`lastRunAt`
      WHEN `legacy`.`lastRunAt` IS NULL THEN `current`.`lastRunAt`
      ELSE GREATEST(`current`.`lastRunAt`, `legacy`.`lastRunAt`)
    END,
    `current`.`updatedAt` = GREATEST(`current`.`updatedAt`, `legacy`.`updatedAt`);
--> statement-breakpoint
DELETE `legacy`
FROM `automation_configs` AS `legacy`
INNER JOIN `automation_configs` AS `current`
  ON `current`.`key` = 'generate-report-draft'
WHERE `legacy`.`key` = 'biennial-report';
--> statement-breakpoint
-- If only the legacy key exists, rename it in place so enabled, cronExpression,
-- task UID, and run history stay attached to the same row. Re-running this
-- statement changes nothing.
UPDATE `automation_configs`
SET `key` = 'generate-report-draft',
    `updatedAt` = CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED)
WHERE `key` = 'biennial-report'
  AND NOT EXISTS (
    SELECT 1
    FROM (
      SELECT `id`
      FROM `automation_configs`
      WHERE `key` = 'generate-report-draft'
      LIMIT 1
    ) AS `existing_report_draft`
  );

-- Down migration (manual and idempotent):
-- UPDATE `automation_configs`
-- SET `key` = 'biennial-report',
--     `updatedAt` = CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED)
-- WHERE `key` = 'generate-report-draft'
--   AND NOT EXISTS (
--     SELECT 1
--     FROM (
--       SELECT `id`
--       FROM `automation_configs`
--       WHERE `key` = 'biennial-report'
--       LIMIT 1
--     ) AS `existing_legacy_report`
--   );
