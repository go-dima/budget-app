CREATE TABLE `description_category_map` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`conflict_options` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `description_category_map_account_description_unique` ON `description_category_map` (`account`,`description`);