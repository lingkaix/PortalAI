import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index, uniqueIndex, check } from "drizzle-orm/sqlite-core";
import {
  CoreMessage, ContentMessage, BaseMessage,
  ChannelType, ChatType, TaskType, ChatTypeValueEnum,
  ActivityTypeEnum, MessageSenderTypeEnum, MessageNetworkStateEnum
} from '../../types'
import { TaskState } from '../../types/a2a';

export const channels = sqliteTable("channels", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  name: text("name").notNull(),
  description: text("description"),
  workspaceId: text("workspace_id").notNull(),
  participants: text("participants", { mode: "json" }).notNull().$type<ChannelType["participants"]>(),
  order: integer("order").notNull().default(0),
  knowledgeBaseIds: text("knowledge_base_ids", { mode: "json" }).$type<ChannelType["knowledgeBaseIds"]>(),
  metadata: text("metadata", { mode: "json" }).$type<ChannelType["metadata"]>(),
}, (table) => [
  uniqueIndex("uuid_idx").on(table.id),
  index("order_idx").on(table.order),
]);

export const chats = sqliteTable("chats", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ChatTypeValueEnum }).notNull(),
  workspaceId: text("workspace_id").notNull(),
  channelId: text("channel_id").notNull(),
  order: integer("order").notNull().default(0),
  lastViewedMessageId: text("last_viewed_message_id").notNull().default("0000"),
  participants: text("participants", { mode: "json" }).notNull().$type<ChatType["participants"]>(),
  metadata: text("metadata", { mode: "json" }).$type<ChatType["metadata"]>(),
}, (table) => [
  uniqueIndex("uuid_idx").on(table.id),
  index("channel_id_idx").on(table.channelId),
  index("order_idx").on(table.order),
]);

export const tasks = sqliteTable("tasks", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  chatId: text("chat_id").notNull(),
  channelId: text("channel_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  summary: text("summary"),
  status: text("status", { enum: Object.values(TaskState) as [string, ...string[]] }).notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch('subsec') * 1000)`).notNull(),
  createdBy: text("created_by").notNull(),
  updates: text("updates", { mode: "json" }).$type<TaskType["updates"]>(),
  metadata: text("metadata", { mode: "json" }).$type<TaskType["metadata"]>(),
}, (table) => [
  uniqueIndex("uuid_idx").on(table.id, table.chatId),
  check("created_at_check", sql`${table.createdAt} >  932428800000`), // check if the timestamp is with milliseconds
]);

export const messages = sqliteTable("messages", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  workspaceId: text("workspace_id").notNull(),
  channelId: text("channel_id").notNull(),
  chatId: text("chat_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderType: text("sender_type", { enum: MessageSenderTypeEnum }).notNull(),
  taskId: text("task_id").notNull().default("0000"),
  summary: text("summary"),
  timestamp: integer("timestamp").notNull().default(sql`(unixepoch('subsec') * 1000)`),
  replyTo: text("reply_to"),
  networkState: text("network_state", { enum: MessageNetworkStateEnum }).notNull(),
  type: text("type", { enum: ActivityTypeEnum }).notNull(),
  payload: text("payload", { mode: "json" }).$type<CoreMessage["payload"]>(),
  metadata: text("metadata", { mode: "json" }).$type<CoreMessage["metadata"]>(),
  // all extra fields for ContentMessage, only available when the type is content_message
  contentMeta: text("content_meta", { mode: "json" }).$type<Omit<ContentMessage, keyof BaseMessage>>(),
}, (table) => [
  index("uuid_idx").on(table.id),
  index("chat_id_idx").on(table.chatId),
  index("sender_id_idx").on(table.senderId),
  index("task_id_idx").on(table.taskId),
  uniqueIndex("unique_message_id_idx").on(table.id, table.chatId),
  check("timestamp_check", sql`${table.timestamp} >  932428800000`), // check if the timestamp is with milliseconds
  // index for contentMeta.isStarred
  // index("context_id_idx").on(table.id, table.chatId).where(sql`json_extract(contentMeta, '$.contextId') IS NOT NULL`),
  index("starred_message_idx").on(table.id, table.chatId).where(sql`json_extract(contentMeta, '$.isStarred') = 1`),
]);

// TODO: better management of assets (parts) in the messages