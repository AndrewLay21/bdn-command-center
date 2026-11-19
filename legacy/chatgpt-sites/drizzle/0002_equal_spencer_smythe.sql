CREATE TABLE `queue_reconciliations` (
	`owner_id` text NOT NULL,
	`request_id` text NOT NULL,
	`task_id` text NOT NULL,
	`override_json` text NOT NULL,
	`digest` text NOT NULL,
	`fingerprint` text NOT NULL,
	`evidence` text NOT NULL,
	`run_id` text NOT NULL,
	`generation` integer NOT NULL,
	`at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `request_id`)
);
