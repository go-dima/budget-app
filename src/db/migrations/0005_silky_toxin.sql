CREATE TABLE `account_column_mapping` (
	`account` text NOT NULL,
	`source_column` text NOT NULL,
	`target_field` text NOT NULL,
	PRIMARY KEY(`account`, `source_column`)
);
