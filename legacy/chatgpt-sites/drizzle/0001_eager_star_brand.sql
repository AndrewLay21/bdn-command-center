CREATE TABLE `task_claim_events` (
	`owner_id` text NOT NULL,
	`request_id` text NOT NULL,
	`task_id` text NOT NULL,
	`run_id` text NOT NULL,
	`action` text NOT NULL,
	`fingerprint` text NOT NULL,
	`generation` integer NOT NULL,
	`at` integer NOT NULL,
	`receipt` text NOT NULL,
	PRIMARY KEY(`owner_id`, `request_id`)
);
--> statement-breakpoint
CREATE TABLE `task_claims` (
	`owner_id` text NOT NULL,
	`task_id` text NOT NULL,
	`run_id` text NOT NULL,
	`token` text NOT NULL,
	`generation` integer NOT NULL,
	`state` text NOT NULL,
	`heartbeat_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_request` text NOT NULL,
	`receipt` text NOT NULL,
	PRIMARY KEY(`owner_id`, `task_id`)
);
