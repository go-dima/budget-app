PRAGMA foreign_keys = OFF;
--> statement-breakpoint
CREATE TABLE `description_category_map_new` (
  `id` text PRIMARY KEY NOT NULL,
  `account` text NOT NULL,
  `description` text NOT NULL,
  `preferred_category_id` text REFERENCES `categories`(`id`),
  `suggested_category_ids` text NOT NULL DEFAULT '[]'
);
--> statement-breakpoint
INSERT INTO `description_category_map_new` (`id`, `account`, `description`, `preferred_category_id`, `suggested_category_ids`)
  SELECT `id`, `account`, `description`, `category_id`, COALESCE(`conflict_options`, '[]')
  FROM `description_category_map`;
--> statement-breakpoint
DROP TABLE `description_category_map`;
--> statement-breakpoint
ALTER TABLE `description_category_map_new` RENAME TO `description_category_map`;
--> statement-breakpoint
CREATE UNIQUE INDEX `description_category_map_account_description_unique` ON `description_category_map` (`account`, `description`);
--> statement-breakpoint
PRAGMA foreign_keys = ON;
