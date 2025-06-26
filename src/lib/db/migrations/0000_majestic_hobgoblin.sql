CREATE TABLE `channels` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`participants` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`knowledge_base_ids` text,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channels__uuid_idx` ON `channels` (`id`);--> statement-breakpoint
CREATE INDEX `channels__order_idx` ON `channels` (`order`);--> statement-breakpoint
CREATE TABLE `chats` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`channel_id` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`last_viewed_message_id` text DEFAULT '0000' NOT NULL,
	`participants` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chats__uuid_idx` ON `chats` (`id`);--> statement-breakpoint
CREATE INDEX `chats__channel_id_idx` ON `chats` (`channel_id`);--> statement-breakpoint
CREATE INDEX `chats__order_idx` ON `chats` (`order`);--> statement-breakpoint
CREATE TABLE `messages` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`channel_id` text NOT NULL,
	`chat_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`sender_type` text NOT NULL,
	`task_id` text DEFAULT '0000' NOT NULL,
	`summary` text,
	`timestamp` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`reply_to` text,
	`network_state` text NOT NULL,
	`type` text NOT NULL,
	`payload` text,
	`metadata` text,
	`content_meta` text,
	CONSTRAINT "messages__timestamp_check" CHECK("messages"."timestamp" >  932428800000)
);
--> statement-breakpoint
CREATE INDEX `messages__uuid_idx` ON `messages` (`id`);--> statement-breakpoint
CREATE INDEX `messages__chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages__sender_id_idx` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `messages__task_id_idx` ON `messages` (`task_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages__unique_message_id_idx` ON `messages` (`id`,`chat_id`);--> statement-breakpoint
CREATE INDEX `messages__starred_message_idx` ON `messages` (`id`,`chat_id`) WHERE json_extract(content_meta, '$.isStarred') = 1;--> statement-breakpoint
CREATE TABLE `tasks` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`chat_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`a2a_id` text,
	`summary` text,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`created_by` text NOT NULL,
	`updates` text,
	`metadata` text,
	CONSTRAINT "tasks__created_at_check" CHECK("tasks"."created_at" >  932428800000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks__uuid_idx` ON `tasks` (`id`,`chat_id`);