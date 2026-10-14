-- Apply the EF migration that adds inquiries.email, inquiries.admin_response,
-- and inquiries.user_id before running this script.
-- This links only rows whose email column already contains a value.

SET SQL_SAFE_UPDATES = 0;

UPDATE `inquiries` AS i
JOIN `Users` AS u
  ON LOWER(TRIM(u.`Email`)) = LOWER(TRIM(i.`email`))
SET i.`user_id` = CAST(u.`Id` AS CHAR(36))
WHERE i.`user_id` IS NULL
  AND i.`email` IS NOT NULL
  AND TRIM(i.`email`) <> '';

SET SQL_SAFE_UPDATES = 1;

-- Confirm schema columns are present.
SHOW COLUMNS FROM `inquiries`;

-- Summarize ownership coverage after the backfill.
SELECT
    COUNT(*) AS total_inquiries,
    SUM(`user_id` IS NOT NULL) AS inquiries_with_user_id,
    SUM(`email` IS NOT NULL AND TRIM(`email`) <> '') AS inquiries_with_email
FROM `inquiries`;

-- Inspect linked records; remove personal columns if only counts are needed.
SELECT
    i.`id`,
    i.`name`,
    i.`email`,
    i.`user_id`,
    i.`reason` AS `subject`,
    i.`status`,
    i.`created_at`
FROM `inquiries` AS i
WHERE i.`user_id` IS NOT NULL
ORDER BY i.`created_at` DESC;
