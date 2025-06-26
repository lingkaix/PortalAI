import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index, uniqueIndex, check } from "drizzle-orm/sqlite-core";
import {
  CoreMessage, ChannelType, ChatType, TaskType, ChatTypeValueEnum,
  MessageTypeEnum, MessageSenderTypeEnum, MessageNetworkStateEnum, ContentMeta
} from '../../types'
import { TaskState } from '../../types/a2a';

export const channels = sqliteTable("channels", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  name: text("name").notNull(),
  description: text("description"),
  participants: text("participants", { mode: "json" }).notNull().$type<ChannelType["participants"]>(),
  order: integer("order").notNull().default(0),
  knowledgeBaseIds: text("knowledge_base_ids", { mode: "json" }).$type<ChannelType["knowledgeBaseIds"]>(),
  metadata: text("metadata", { mode: "json" }).$type<ChannelType["metadata"]>(),
}, (table) => [
  uniqueIndex("channels__uuid_idx").on(table.id),
  index("channels__order_idx").on(table.order),
]);

export const chats = sqliteTable("chats", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ChatTypeValueEnum }).notNull(),
  channelId: text("channel_id").notNull(),
  order: integer("order").notNull().default(0),
  lastViewedMessageId: text("last_viewed_message_id").notNull().default("0000"),
  participants: text("participants", { mode: "json" }).notNull().$type<ChatType["participants"]>(),
  metadata: text("metadata", { mode: "json" }).$type<ChatType["metadata"]>(),
}, (table) => [
  uniqueIndex("chats__uuid_idx").on(table.id),
  index("chats__channel_id_idx").on(table.channelId),
  index("chats__order_idx").on(table.order),
]);

export const tasks = sqliteTable("tasks", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  chatId: text("chat_id").notNull(),
  channelId: text("channel_id").notNull(),
  a2aId: text("a2a_id"),
  summary: text("summary"),
  status: text("status", { enum: Object.values(TaskState) as [string, ...string[]] }).notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch('subsec') * 1000)`).notNull(),
  createdBy: text("created_by").notNull(),
  updates: text("updates", { mode: "json" }).$type<TaskType["updates"]>(),
  metadata: text("metadata", { mode: "json" }).$type<TaskType["metadata"]>(),
}, (table) => [
  uniqueIndex("tasks__uuid_idx").on(table.id, table.chatId),
  check("tasks__created_at_check", sql`${table.createdAt} >  932428800000`), // check if the timestamp is with milliseconds
]);

export const messages = sqliteTable("messages", {
  _id: integer("_id").primaryKey({ autoIncrement: true }), // this is internal id for the database
  id: text("id").notNull(), // this is the real uuidv7 id
  channelId: text("channel_id").notNull(),
  chatId: text("chat_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderType: text("sender_type", { enum: MessageSenderTypeEnum }).notNull(),
  taskId: text("task_id").notNull().default("0000"),
  summary: text("summary"),
  timestamp: integer("timestamp").notNull().default(sql`(unixepoch('subsec') * 1000)`),
  replyTo: text("reply_to"),
  networkState: text("network_state", { enum: MessageNetworkStateEnum }).notNull(),
  type: text("type", { enum: MessageTypeEnum }).notNull(),
  payload: text("payload", { mode: "json" }).$type<CoreMessage["payload"]>(),
  metadata: text("metadata", { mode: "json" }).$type<CoreMessage["metadata"]>(),
  // all extra fields for ContentMessage, only available when the type is content_message
  contentMeta: text("content_meta", { mode: "json" }).$type<ContentMeta>(),
}, (table) => [
  index("messages__uuid_idx").on(table.id),
  index("messages__chat_id_idx").on(table.chatId),
  index("messages__sender_id_idx").on(table.senderId),
  index("messages__task_id_idx").on(table.taskId),
  uniqueIndex("messages__unique_message_id_idx").on(table.id, table.chatId),
  
  check("messages__timestamp_check", sql`${table.timestamp} >  932428800000`), // check if the timestamp is with milliseconds
  
  // index("context_id_idx").on(sql`json_extract(contentMeta, '$.contextId')`),
  index("messages__starred_message_idx").on(table.id, table.chatId).where(sql`json_extract(content_meta, '$.isStarred') = 1`),
]);

// TODO: better management of assets (parts) in the messages