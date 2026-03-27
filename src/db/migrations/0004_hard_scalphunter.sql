CREATE TABLE `description_payment_method_map` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`description` text NOT NULL,
	`preferred_payment_method` text,
	`suggested_payment_methods` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `description_payment_method_map_account_description_unique` ON `description_payment_method_map` (`account`,`description`);