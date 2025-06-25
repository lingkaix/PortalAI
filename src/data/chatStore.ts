import { create } from "zustand";
import {
  CoreMessage,
  ContentMessage,
  ChatType,
  ChannelType,
  TaskType,
} from "../types";
import { getSQLiteDB } from "../lib/db/database";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "../lib/db/schema";
import { useAppStateStore } from "./appStateStore";
import { eq, desc, asc, and, sql, gte, lt } from "drizzle-orm";
import { separateContentMeta, inflateMessage } from "../lib/message";
import { generateId } from "../lib/utils";

// --- Core Data Structures ---
/** Enhanced channel info for UI with computed fields */
export interface ChannelInfo extends ChannelType {
  latestUpdateTimestamp: number; // Most recent activity timestamp
  hasUnread: boolean; // Whether the channel has unread messages

  isLoading: boolean;

  pinnedChatIds: string[]; // sorted by order
  unreadChatIds: string[]; // sorted by latestMessageTimestamp
  activeChatIds: string[]; // normal (order=0) chats, sorted by latestMessageTimestamp
  _id: number; // number id in the database
}
/** Enhanced chat info for dashboard display */
export interface ChatInfo extends ChatType {
  latestMessageTimestamp: number; // For sorting by activity, refresh when new message is added
  unreadCount: number; // Total unread messages in the chat, calculated from lastViewedMessageId to the newest message

  isInitialised: boolean;
  isLoadingInitial: boolean;
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;

  messages: (CoreMessage & { _id: number })[];
  _id: number; // number id in the database
}

/** Index structures for O(1) lookups */
export interface ChannelIndex {
  [channelId: string]: ChannelInfo;
}
export interface ChatIndex {
  [chatId: string]: ChatInfo;
}

export interface TaskIndex {
  [taskId: string]: TaskType;
}


// --- Store State Interface ---
export interface ChatStoreState {
  // === Core State ===
  db: SqliteRemoteDatabase<typeof schema>;
  appStateStore: typeof useAppStateStore;

  // === Data Indexes ===
  pinnedChannelIds: string[]; // sorted by order
  unreadChannelIds: string[]; // sorted by lastActivity
  activeChannelIds: string[]; // normal (order=0) channels, sorted by lastActivity
  channels: ChannelIndex; // All channels
  chats: ChatIndex; // All chats across channels
  tasks: TaskIndex; // TODO: (post MVP) Task index for context

  // === Active Selections ===
  viewingChannelId: string | null; // if user is viewing the channel dashboard
  viewingChatId: string | null; // if user is in the chat UI
  isAtChatEnd: boolean; // if user is at the end of the chat

  // true if the index is built and ready to use
  isLoading: boolean;

  workspaceId: string;

  // === CHANNEL MANAGEMENT ===

  /** Set active channel and load its chats */
  setActiveChannel: (channelId: string | null) => Promise<void>;
  /** Pin/unpin channel and update order */
  toggleChannelPin: (channelId: string, pinnedOrder?: number) => Promise<void>;
  /** Reorder pinned channels */
  reorderPinnedChannels: (channelIds: string[]) => Promise<void>;
  /** Mark all chats in channel as read */
  markChannelAsRead: (channelId: string) => Promise<void>;
  /** Set channel profile */
  setChannelProfile: (channelId: string, profile: Partial<ChannelType>) => Promise<void>;
  /** create a new channel */
  createChannel: (channel: ChannelType) => Promise<void>;
  /** toggle channel archive, update the channel's order to 0 (normal) or -1 (archived) */
  toggleChannelArchive: (channelId: string) => Promise<void>;

  // === CHAT MANAGEMENT ===

  /** Set active chat and load its messages */
  setActiveChat: (chatId: string | null) => Promise<void>;
  /** Pin/unpin chat within its channel */
  toggleChatPin: (chatId: string, pinnedOrder?: number) => Promise<void>;
  /** Reorder pinned chats within a channel */
  reorderPinnedChats: (channelId: string, chatIds: string[]) => Promise<void>;
  /** Mark chat as read and update unread counts */
  markChatAsRead: (chatId: string) => Promise<void>;
  /** Set chat profile */
  setChatProfile: (chatId: string, profile: Partial<ChatType>) => Promise<void>;
  /** create a new chat */
  createChat: (chat: ChatType) => Promise<void>;
  /** toggle chat archive, update the chat's order to 0 (normal) or -1 (archived) */
  toggleChatArchive: (chatId: string) => Promise<void>;
  /** Update last viewed message and read progress */
  updateLastViewedMessage: (chatId: string, messageId: string) => Promise<void>;

  // === MESSAGE MANAGEMENT ===

  /** Load starred messages for specific chat or user */
  loadStarredMessages: (options?: {
    chatId?: string;
    senderId?: string;
    limit?: number;
  }) => Promise<CoreMessage[]>;
  /** when user sends a message or the app receives a message, add it to this store and sync to database
   * update related statuses:
   * - ChannelInfo.lastActivity
   * - ChannelInfo.hasUnread
   * - ChatInfo.unreadCount
   * - ChatInfo.latestMessageTimestamp
   * - ChatInfo.messages
   * - ChannelInfo.activeChatIds
   * - ChannelInfo.unreadChatIds (if the chat is not being viewed, and not at the end of the chat, then add it to the unreadChatIds)
   * @returns the _id of the message in the database
   * TODO: now wen only asume the text parts and data parts which directly store in the database
   * TODO: in the future, we will need to handle the file parts
   */
  addMessage: (message: CoreMessage) => Promise<CoreMessage & { _id: number }>;
  /** Edit existing message */
  editMessage: (chatId: string, messageId: string, newContent: ContentMessage['payload']) => Promise<void>;
  /** Delete message (hard delete from database) */
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  /** Star/unstar message for easy reference */
  toggleMessageStar: (chatId: string, messageId: string) => Promise<void>;
  /** Add reaction to message */
  addReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  /** Remove reaction from message */
  removeReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  /** Get specific message by ID with O(1) lookup */
  getMessageById: (chatId: string, messageId: string) => CoreMessage & { _id: number } | null

  // === INDEX MANAGEMENT ===

  /** Initialize store: setup DB, restore app state from AppStateStore, 
   * load basic data and calculate states of channels and chats.
   * NOTE: during the initialization, we reject any update to the store until we build the channle and chatindex.
   */
  init: (appStateStore: typeof useAppStateStore) => Promise<void>;

  /** From database: load all channels (order >= 0) with basic info to build channel index.
   * Then use loadChannelChats to update channels.
   * Normally, we only do this once on store initialization (or maybe reload the cache). 
   * NOTE: during the load, we reject any update to the store until we build the channle and chatindex.
   */
  loadIndex: () => Promise<void>;
  /** Clear all index data (force reload) */
  reloadIndex: () => void;
  /** Load chats for channel dashboard (pinned + unread + recent).
   * From database: load all pinned chats (order > 0) within channel and check if they have unread messages,
   * then go through all unpinned chats (order = 0) within channel and check if they have unread messages,
   * if it does, load the chat into the chat index, load messages via loadChat,
   * then compute and update the channel's lastActivity and hasUnread status.
   */
  loadChannel: (channelId: string) => Promise<void>;
  /** remove a channel from the index */
  removeChannel: (channelId: string) => void;
  /** Invalidate and reload specific channel's chats */
  reloadChannel: (channelId: string) => Promise<void>;
  /** Load initial messages and pages until last viewed message */
  loadChat: (chatId: string) => Promise<void>;
  /** Load more messages for infinite scroll */
  loadMoreMessages: (chatId: string) => Promise<void>;
  /** remove a chat from the index */
  removeChat: (chatId: string) => void;
  /** Clear message cache for specific chat and reload the chat */
  reloadChat: (chatId: string) => void;

  // TODO: (post MVP) Task management
  // loadTasks: (chatId: string) => Promise<void>;

  createTask: (task: TaskType) => Promise<void>;
  // commonly, we update task state
  updateTask: (taskId: string, chatId: string, task: Partial<TaskType>) => Promise<void>;
}


export const useChatStore = create<ChatStoreState>()(
  (set, get) => ({
    // Initial state
    db: new Object() as SqliteRemoteDatabase<typeof schema>,
    // TODO: (post MVP)use appStateStore to get and store app states persistently
    appStateStore: useAppStateStore,
    pinnedChannelIds: [],
    unreadChannelIds: [],
    activeChannelIds: [],
    channels: {},
    // TODO： post MVP. use immer middleware for large Object updates
    chats: {},
    tasks: {},

    viewingChannelId: null,
    viewingChatId: null,
    isAtChatEnd: false,

    isLoading: false,

    // TODO: post MVP
    workspaceId: '0000',

    // Core initialization
    init: async (appStateStore) => {
      set({ appStateStore });
      const db = await getSQLiteDB(schema);
      set({ db });
      await get().loadIndex();
      set({ isLoading: true });
    },

    // Channel management - implementations would follow the patterns above

    setActiveChannel: async (channelId) => {
      set({ viewingChannelId: channelId });
      if (channelId) {
        await get().loadChannel(channelId);
      }
    },

    toggleChannelPin: async (channelId, pinnedOrder) => {
      
      // Implementation: Update channel order in DB and local state
    },

    reorderPinnedChannels: async (channelIds) => {
      // Implementation: Batch update channel orders
    },

    markChannelAsRead: async (channelId) => {
      const { chats } = get();
      const channelChats = Object.values(chats).filter(chat => chat.channelId === channelId);

      // Mark all chats in this channel as read
      for (const chat of channelChats) {
        await get().markChatAsRead(chat.id);
      }
    },

    setChannelProfile: async (channelId, profile) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Update channel in database
        await db
          .update(schema.channels)
          .set(profile)
          .where(eq(schema.channels.id, channelId));

        // Update local state
        const { channels } = get();
        if (channels[channelId]) {
          set({
            channels: {
              ...channels,
              [channelId]: {
                ...channels[channelId],
                ...profile,
              }
            }
          });
        }
      } catch (error) {
        console.error("Failed to update channel profile:", error);
        throw error;
      }
    },
    createChannel: async (channel) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      await db.insert(schema.channels).values(channel);
    },
    toggleChannelArchive: async (channelId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");
      const channel = get().channels[channelId];
      if (!channel) throw new Error("Channel not found");

      if (channel.order < 0) {
        // unarchive
        const order = 0;
        await db.update(schema.channels).set({ order }).where(eq(schema.channels.id, channelId));
        get().loadChannel(channelId);
      } else {
        // archive
        const order = -1;
        await db.update(schema.channels).set({ order }).where(eq(schema.channels.id, channelId));
        get().removeChannel
      }
    },
    // Chat management

    setActiveChat: async (chatId) => {
      set({ viewingChatId: chatId });
      if (chatId) {
        await get().loadChat(chatId);
      }
    },

    toggleChatPin: async (chatId, pinnedOrder) => {
      // Implementation: Update chat order in DB and local state
    },

    reorderPinnedChats: async (channelId, chatIds) => {
      // Implementation: Batch update chat orders within channel
    },

    markChatAsRead: async (chatId) => {
      try {
        // Update local state - unreadCount is a computed field from messages
        const { chats } = get();
        if (chats[chatId]) {
          set({
            chats: {
              ...chats,
              [chatId]: {
                ...chats[chatId],
                unreadCount: 0,
              }
            }
          });

          // Update channel's hasUnread status
          const chat = chats[chatId];
          if (chat.channelId) {
            const { channels } = get();
            // Use the updated chats to check for unread status
            const updatedChatsState = get().chats;
            const channelChats = Object.values(updatedChatsState).filter(c => c.channelId === chat.channelId);
            const hasUnread = channelChats.some(c => c.unreadCount > 0);

            if (channels[chat.channelId]) {
              set({
                channels: {
                  ...channels,
                  [chat.channelId]: {
                    ...channels[chat.channelId],
                    hasUnread,
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to mark chat as read:", error);
        throw error;
      }
    },

    setChatProfile: async (chatId, profile) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Update chat in database
        await db
          .update(schema.chats)
          .set(profile)
          .where(eq(schema.chats.id, chatId));

        // Update local state
        const { chats } = get();
        if (chats[chatId]) {
          set({
            chats: {
              ...chats,
              [chatId]: {
                ...chats[chatId],
                ...profile,
              }
            }
          });
        }
      } catch (error) {
        console.error("Failed to update chat profile:", error);
        throw error;
      }
    },
    createChat: async (chat) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      await db.insert(schema.chats).values(chat);
    },
    toggleChatArchive: async (chatId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      const chat = get().chats[chatId];
      if (!chat) throw new Error("Chat not found");
      if (chat.order < 0) {
        // unarchive
        const order = 0;
        await db.update(schema.chats).set({ order }).where(eq(schema.chats.id, chatId));
        get().loadChat(chatId);
      } else {
        // archive
        const order = -1;
        await db.update(schema.chats).set({ order }).where(eq(schema.chats.id, chatId));
        get().removeChat(chatId);
      }
    },
    updateLastViewedMessage: async (chatId, messageId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        const { chats } = get();
        const lastViewedMessageIndex = chats[chatId].messages.findIndex(message => message.id === messageId);

        if (lastViewedMessageIndex === -1) {
          throw new Error("Message not found in chat");
        }

        // Update chat's lastViewedMessageId in database
        await db
          .update(schema.chats)
          .set({ lastViewedMessageId: messageId })
          .where(eq(schema.chats.id, chatId));

        // Update local chat state
        // Recalculate unread count (distance to the last message in the chat)
        const unreadCount = chats[chatId].messages.length - lastViewedMessageIndex - 1;
        if (chats[chatId]) {
          set({
            chats: {
              ...chats,
              [chatId]: {
                ...chats[chatId],
                lastViewedMessageId: messageId,
                unreadCount,
              }
            }
          });
        }


      } catch (error) {
        console.error("Failed to update last viewed message:", error);
        throw error;
      }
    },
    // Message management

    loadStarredMessages: async (options = {}) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      const { chatId, senderId, limit = 50 } = options;

      try {
        const conditions = [
          sql`json_extract(${schema.messages.contentMeta}, '$.isStarred') = 1`
        ];

        if (chatId) conditions.push(eq(schema.messages.chatId, chatId));
        if (senderId) conditions.push(eq(schema.messages.senderId, senderId));

        const dbMessages = await db.select().from(schema.messages).where(and(...conditions)).orderBy(desc(schema.messages.timestamp)).limit(limit);

        return dbMessages.map(inflateMessage);
      } catch (error) {
        console.error("Failed to load starred messages:", error);
        return [];
      }
    },

    addMessage: async (message) => {
      const { db, chats, channels } = get();
      if (!db) throw new Error("Database not initialized");

      const channel = channels[message.channelId];
      if (!channel) throw new Error("Channel not found");

      const chat = chats[message.chatId];
      if (!chat) throw new Error("Chat not found");

      let messageToStore: typeof schema.messages.$inferInsert;

      if (message.type === 'content') {
        const { base, meta } = separateContentMeta(message);
        messageToStore = {
          ...base,
          timestamp: undefined, // Let DB set it
          contentMeta: meta
        };
      } else {
        messageToStore = {
          ...message,
          timestamp: undefined, // Let DB set it
        };
      }

      messageToStore.id = generateId();
      await db.insert(schema.messages).values(messageToStore);

      const query = await db.select().from(schema.messages).where(and(eq(schema.messages.id, message.id), eq(schema.messages.chatId, chat.id))).limit(1);
      if (query.length === 0) throw new Error("Message failed to store");

      const insertedMessage = inflateMessage(query[0]) as CoreMessage & { _id: number };

      // Update local state
      set((state) => {
        const newChat = { ...state.chats[chat.id] };
        newChat.latestMessageTimestamp = insertedMessage.timestamp;
        newChat.messages = [...newChat.messages, insertedMessage];

        const isViewingThisChat = get().viewingChatId === chat.id && get().isAtChatEnd;
        if (!isViewingThisChat) {
          newChat.unreadCount++;
        }

        const newChannel = { ...state.channels[channel.id] };
        newChannel.latestUpdateTimestamp = insertedMessage.timestamp;

        if (!isViewingThisChat && !newChannel.unreadChatIds.includes(chat.id)) {
          newChannel.unreadChatIds = [chat.id, ...newChannel.unreadChatIds];
          newChannel.hasUnread = true;
        }

        // Re-sort active chats
        newChannel.activeChatIds.sort((a, b) => (state.chats[b]?.latestMessageTimestamp || 0) - (state.chats[a]?.latestMessageTimestamp || 0));

        return {
          chats: { ...state.chats, [chat.id]: newChat },
          channels: { ...state.channels, [channel.id]: newChannel }
        };
      });

      return insertedMessage;
    },

    editMessage: async (chatId, messageId, newContent) => {
      // Implementation: Update message content
    },

    deleteMessage: async (chatId, messageId) => {
      // Implementation: Soft delete message
    },

    toggleMessageStar: async (chatId, messageId) => {
      const { db, chats } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        const [dbMessage] = await db.select().from(schema.messages).where(and(eq(schema.messages.id, messageId), eq(schema.messages.chatId, chatId))).limit(1);
        if (!dbMessage || dbMessage.type !== 'content' || !dbMessage.contentMeta) throw new Error("Star-able message not found");

        const newMeta = { ...dbMessage.contentMeta, isStarred: !dbMessage.contentMeta.isStarred };

        await db.update(schema.messages).set({ contentMeta: newMeta }).where(eq(schema.messages.id, messageId));

        // Update local state
        const chat = chats[chatId];
        if (chat) {
          const messageIndex = chat.messages.findIndex(m => m.id === messageId);
          if (messageIndex !== -1) {
            const updatedMessages = [...chat.messages];
            const msg = updatedMessages[messageIndex] as ContentMessage & { _id: number };
            updatedMessages[messageIndex] = { ...msg, isStarred: newMeta.isStarred };
            set(state => ({
              chats: { ...state.chats, [chatId]: { ...chat, messages: updatedMessages } }
            }));
          }
        }
      } catch (error) {
        console.error("Failed to toggle message star:", error);
        throw error;
      }
    },

    addReaction: async (chatId, messageId, emoji) => {
      // Implementation: Add reaction to message
    },

    removeReaction: async (chatId, messageId, emoji) => {
      // Implementation: Remove reaction from message
    },

    getMessageById: (chatId, messageId) => {
      const { chats } = get();
      const chat = chats[chatId];
      if (!chat) return null;

      return chat.messages.find(msg => msg.id === messageId) || null;
    },

    // index management

    loadIndex: async () => {
      set({ isLoading: true });
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      // get all active channels
      const allChannlesIdsQuery = await db.select({ id: schema.channels.id }).
        from(schema.channels).where(gte(schema.channels.order, 0))
        .orderBy(asc(schema.channels.order), asc(schema.channels._id))
      const allChannlesIds = (await allChannlesIdsQuery).map(result => result.id);

      // load all active channels
      await Promise.all(allChannlesIds.map(async (channelId) => {
        await get().loadChannel(channelId);
      }));

      // recalculate pinnedChannelIds, unreadChannelIds, activeChannelIds
      const pinnedChannelIds = allChannlesIds
        .filter(channelId => get().channels[channelId].order > 0)
        .sort((a, b) => get().channels[b].order - get().channels[a].order);
      const unreadChannelIds = allChannlesIds
        .filter(channelId => get().channels[channelId].hasUnread)
        .sort((a, b) => get().channels[b]._id - get().channels[a]._id);
      const activeChannelIds = allChannlesIds
        .filter(channelId => get().channels[channelId].order === 0)
        .sort((a, b) => get().channels[b]._id - get().channels[a]._id);
      set({ pinnedChannelIds, unreadChannelIds, activeChannelIds });

      set({ isLoading: false });
    },
    reloadIndex: () => {
      set({ isLoading: true });
      set({
        channels: {},
        chats: {},
        tasks: {},
        viewingChannelId: null,
        viewingChatId: null,
      });
      get().loadIndex();
      set({ isLoading: false });
    },

    loadChannel: async (channelId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      const channel = await db.select().from(schema.channels).where(eq(schema.channels.id, channelId)).limit(1);
      if (!channel) throw new Error("Channel not found");

      // get all active chats
      // load each chat's lastViewedMessageId and its latest message's timestamp
      const allChatsIdsQuery = await db.select({
        chatId: schema.chats.id,
        order: schema.chats.order,
        lastViewedMessageId: schema.chats.lastViewedMessageId,
        lastViewedMessageTimestamp: sql<number | null>`(SELECT timestamp FROM ${schema.messages} WHERE id = ${schema.chats.lastViewedMessageId} LIMIT 1)`,
        latestMessageTimestamp: sql<number | null>`(SELECT timestamp FROM ${schema.messages} WHERE chatId = ${schema.chats.id} ORDER BY _id DESC LIMIT 1)`,
        _id: schema.chats._id,
      }).from(schema.chats).where(and(eq(schema.chats.channelId, channelId), gte(schema.chats.order, 0)))
        .orderBy(asc(schema.chats.order), asc(schema.chats._id))

      const allChatsIds = allChatsIdsQuery.map(result => result.chatId);
      const allChatsInfo: {
        [chatId: string]:
        { order: number, lastViewedMessageId: string, lastViewedMessageTimestamp: number, latestMessageTimestamp: number, _id: number }
      } = {};
      allChatsIdsQuery.forEach(result => {
        allChatsInfo[result.chatId] = {
          lastViewedMessageId: result.lastViewedMessageId,
          lastViewedMessageTimestamp: result.lastViewedMessageTimestamp || 0,
          latestMessageTimestamp: result.latestMessageTimestamp || 0,
          order: result.order,
          _id: result._id,
        }
      })

      const pinnedChatIds = allChatsIds.filter(chatId => allChatsInfo[chatId].order > 0)
        .sort((a: string, b: string) => allChatsInfo[b].order - allChatsInfo[a].order);
      const unreadChatIds = allChatsIds.filter(chatId => allChatsInfo[chatId].lastViewedMessageTimestamp < allChatsInfo[chatId].latestMessageTimestamp)
        .sort((a: string, b: string) => allChatsInfo[b].latestMessageTimestamp - allChatsInfo[a].latestMessageTimestamp);
      const activeChatIds = allChatsIds.filter(chatId => allChatsInfo[chatId].order === 0)
        .sort((a: string, b: string) => allChatsInfo[b].latestMessageTimestamp - allChatsInfo[a].latestMessageTimestamp);

      const lastActivityChatId = allChatsIds[0] ? allChatsIds.reduce((previousChatId, chatId) => {
        const previousChatTimestamp = allChatsInfo[previousChatId]?.latestMessageTimestamp ?? 0;
        const currentChatTimestamp = allChatsInfo[chatId]?.latestMessageTimestamp ?? 0;
        return currentChatTimestamp > previousChatTimestamp ? chatId : previousChatId;
      }) : '';

      const channelInfo: ChannelInfo = {
        ...channel[0],
        latestUpdateTimestamp: lastActivityChatId ? allChatsInfo[lastActivityChatId].latestMessageTimestamp : 0,
        hasUnread: unreadChatIds.length > 0,
        isLoading: false,
        pinnedChatIds: pinnedChatIds,
        unreadChatIds: unreadChatIds,
        activeChatIds: activeChatIds,
        _id: channel[0]._id,
      }

      // load chats WITHOUT initialisation and set isInitialised to false
      const chatsQuery = await db.select().from(schema.chats).where(and(eq(schema.chats.channelId, channelId), gte(schema.chats.order, 0))).orderBy(desc(schema.chats._id));
      // all chats that is not in the index
      const newChats: ChatIndex = {};
      chatsQuery.forEach(chat => {
        if (!get().chats[chat.id]) {
          newChats[chat.id] = {
            ...chat,
            isInitialised: false, // has not been initialised yet
            isLoadingInitial: false, // is loading initial messages
            isLoadingOlder: false,
            hasMoreOlder: true,
            unreadCount: 0,
            latestMessageTimestamp: 0,
            messages: [],
            _id: chat._id,
          }
        }
      });

      set({ channels: { ...get().channels, [channelId]: channelInfo }, chats: { ...get().chats, ...newChats } });
    },
    removeChannel: (channelId) => {
      let channelList = get().channels;
      delete channelList[channelId];
      set({ channels: channelList });
    },
    reloadChannel: async (channelId) => {
      await get().loadChannel(channelId);
    },
    loadChat: async (chatId) => {
      const { db, chats } = get();
      if (!db) throw new Error("Database not initialized");

      if (!chats[chatId]) throw new Error("Chat not found in the index");
      // only load chat if it is not already loaded (and not loading)
      if (chats[chatId].isInitialised && chats[chatId].messages.length !== 0
        && chats[chatId].isLoadingInitial && chats[chatId].isLoadingOlder) return;

      set({
        chats: {
          ...chats,
          [chatId]: {
            ...chats[chatId],
            isLoadingInitial: true,
          }
        }
      });

      // find the latest message in the chat
      let latestMessageQuery = await db.select().from(schema.messages).where(eq(schema.messages.chatId, chatId)).orderBy(desc(schema.messages._id)).limit(1);

      // if latestMessageQuery is empty, which means the chat has no messages,
      // set chat state and return
      if (latestMessageQuery.length === 0) {
        set({
          isAtChatEnd: chatId === get().viewingChatId ? true : get().isAtChatEnd,
          chats: {
            ...chats,
            [chatId]: {
              ...chats[chatId], isInitialised: true, isLoadingInitial: false, isLoadingOlder: false,
              hasMoreOlder: false, unreadCount: 0, latestMessageTimestamp: 0, messages: []
            }
          }
        });
        return;
      } else {
        chats[chatId].latestMessageTimestamp = latestMessageQuery[0].timestamp;
      }

      // if cannot find the last viewed message, set lastViewedMessageId to the latest message
      let lastViewedMessageQuery = await db.select().from(schema.messages)
        .where(and(eq(schema.messages.chatId, chatId), eq(schema.messages.id, chats[chatId].lastViewedMessageId))).limit(1);
      let lastViewedMessageDbId = lastViewedMessageQuery[0]?.id;
      if (!lastViewedMessageDbId) {
        await db.update(schema.chats).set({ lastViewedMessageId: latestMessageQuery[0].id }).where(eq(schema.chats.id, chatId));
        chats[chatId].lastViewedMessageId = latestMessageQuery[0].id; //no re-render without set()
      }

      // load the latest 20 messages if lastViewedMessageId is invalid(uuidv7) or '0000', 
      // OR last viewed message's _id equals (or maybe greater than?) to the latest message's _id
      let dbMessages: (typeof schema.messages.$inferSelect)[] = [];
      let isAtChatEnd = false;
      if (chats[chatId].lastViewedMessageId == '0000' ||
        chats[chatId].lastViewedMessageId == latestMessageQuery[0].id ||
        lastViewedMessageQuery[0]._id >= latestMessageQuery[0]._id
      ) {
        // load the latest 20 messages
        dbMessages = await db.select().from(schema.messages)
          .where(eq(schema.messages.chatId, chatId)).orderBy(desc(schema.messages._id)).limit(20);
        chats[chatId].hasMoreOlder = false;

        isAtChatEnd = true;
      } else {
        // load messages from the latest message to the last viewed message
        dbMessages = await db.select().from(schema.messages)
          .where(and(eq(schema.messages.chatId, chatId), gte(schema.messages._id, lastViewedMessageQuery[0]._id))).orderBy(desc(schema.messages._id));
        chats[chatId].unreadCount = dbMessages.length;

        // load 20 more messages if messagesQuery.length < 10, else load 10 more messages
        if (dbMessages.length < 10) {
          let moreMessagesQuery = await db.select().from(schema.messages)
            .where(and(eq(schema.messages.chatId, chatId), lt(schema.messages._id, dbMessages[dbMessages.length - 1]._id)))
            .orderBy(desc(schema.messages._id)).limit(20);
          if (moreMessagesQuery.length < 20) chats[chatId].hasMoreOlder = false;
          dbMessages = [...dbMessages, ...moreMessagesQuery];
        } else {
          let moreMessagesQuery = await db.select().from(schema.messages)
            .where(and(eq(schema.messages.chatId, chatId), lt(schema.messages._id, dbMessages[dbMessages.length - 1]._id)))
            .orderBy(desc(schema.messages._id)).limit(10);
          if (moreMessagesQuery.length < 10) chats[chatId].hasMoreOlder = false;
          dbMessages = [...dbMessages, ...moreMessagesQuery];
        }
        isAtChatEnd = false;
      }

      const messages: (CoreMessage & { _id: number })[] = dbMessages.map(dbm => ({ ...inflateMessage(dbm), _id: dbm._id } as CoreMessage & { _id: number })).reverse();

      set({
        isAtChatEnd: chatId === get().viewingChatId ? isAtChatEnd : get().isAtChatEnd,
        chats: {
          ...chats,
          [chatId]: {
            ...chats[chatId],
            isInitialised: true,
            isLoadingInitial: false,
            isLoadingOlder: false,
            messages: messages
          }
        }
      });
    },

    loadMoreMessages: async (chatId) => {
      const { db, chats } = get();
      if (!db) throw new Error("Database not initialized");

      const chat = chats[chatId];
      if (!chat) throw new Error("Chat not found in the index");

      if (!chat.isInitialised) {
        await get().loadChat(chatId);
        return;
      }

      // Prevent duplicate loading or loading when no more messages
      if (chat.isLoadingOlder || !chat.hasMoreOlder) return;

      // Set loading state
      set({
        chats: {
          ...chats,
          [chatId]: {
            ...chat,
            isLoadingOlder: true,
          }
        }
      });


      // load 20 more messages
      let dbMessages: (typeof schema.messages.$inferSelect)[] = [];
      if (chat.messages.length === 0) {
        // load the latest 20 messages
        dbMessages = await db.select().from(schema.messages)
          .where(eq(schema.messages.chatId, chatId)).orderBy(desc(schema.messages._id)).limit(20);
      } else {
        // load 20 more older messages
        dbMessages = await db.select().from(schema.messages)
          .where(and(eq(schema.messages.chatId, chatId), lt(schema.messages._id, chat.messages[0]._id)))
          .orderBy(desc(schema.messages._id)).limit(20);
      }

      const messages: (CoreMessage & { _id: number })[] = dbMessages.map(dbm => ({ ...inflateMessage(dbm), _id: dbm._id } as CoreMessage & { _id: number })).reverse();

      set({
        chats: {
          ...chats,
          [chatId]: {
            ...chat,
            isLoadingOlder: false,
            hasMoreOlder: dbMessages.length < 20,
            messages: [...messages, ...chat.messages]
          }
        }
      });
    },
    removeChat: (chatId) => {
      let chatList = get().chats;
      delete chatList[chatId];
      set({ chats: chatList });
    },
    reloadChat: (chatId) => {
      get().removeChat(chatId);
      get().loadChat(chatId);
    },

    createTask: async (task) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      await db.insert(schema.tasks).values(task);
    },
    updateTask: async (taskId, chatId, task) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      // TODO: guard against invalid updates
      task.id = taskId;
      task.chatId = chatId;

      await db.update(schema.tasks).set(task).where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.chatId, chatId)));
    },

  }),
);
