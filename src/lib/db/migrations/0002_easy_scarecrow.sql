PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
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
	CONSTRAINT "messages__timestamp_check" CHECK("__new_messages"."timestamp" >  932428800000)
);
--> statement-breakpoint
INSERT INTO `__new_messages`("_id", "id", "workspace_id", "channel_id", "chat_id", "sender_id", "sender_type", "task_id", "summary", "timestamp", "reply_to", "network_state", "type", "payload", "metadata", "content_meta") SELECT "_id", "id", "workspace_id", "channel_id", "chat_id", "sender_id", "sender_type", "task_id", "summary", "timestamp", "reply_to", "network_state", "type", "payload", "metadata", "content_meta" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `messages__uuid_idx` ON `messages` (`id`);--> statement-breakpoint
CREATE INDEX `messages__chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages__sender_id_idx` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `messages__task_id_idx` ON `messages` (`task_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages__unique_message_id_idx` ON `messages` (`id`,`chat_id`);--> statement-breakpoint
CREATE INDEX `messages__starred_message_idx` ON `messages` (`id`,`chat_id`) WHERE json_extract(contentMeta, '$.isStarred') = 1;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`chat_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`a2a_id` text,
	`summary` text,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`created_by` text NOT NULL,
	`updates` text,
	`metadata` text,
	CONSTRAINT "tasks__created_at_check" CHECK("__new_tasks"."created_at" >  932428800000)
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("_id", "id", "chat_id", "channel_id", "workspace_id", "a2a_id", "summary", "status", "created_at", "created_by", "updates", "metadata") SELECT "_id", "id", "chat_id", "channel_id", "workspace_id", "a2a_id", "summary", "status", "created_at", "created_by", "updates", "metadata" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE UNIQUE INDEX `tasks__uuid_idx` ON `tasks` (`id`,`chat_id`);--> statement-breakpoint
DROP INDEX `uuid_idx`;--> statement-breakpoint
DROP INDEX `order_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `channels__uuid_idx` ON `channels` (`id`);--> statement-breakpoint
CREATE INDEX `channels__order_idx` ON `channels` (`order`);--> statement-breakpoint
DROP INDEX `channel_id_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `chats__uuid_idx` ON `chats` (`id`);--> statement-breakpoint
CREATE INDEX `chats__channel_id_idx` ON `chats` (`channel_id`);--> statement-breakpoint
CREATE INDEX `chats__order_idx` ON `chats` (`order`);