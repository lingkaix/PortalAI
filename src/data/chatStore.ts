import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CoreMessage, newMessage } from "../types/message";
import { ChatType } from "../types/chat";
import { readJsonFile, writeJsonFile } from "../lib/localAppData";
import { generateId } from "../lib/utils"; // Import the centralized ID generator

// --- Persistence Layer Interface (re-defined here for clarity or import from a shared types/interfaces file) ---
export interface ChatPersistence {
  saveChat(chat: ChatType): Promise<void>;
  loadChat(chatId: string): Promise<ChatType | null>;
  deleteChat(chatId: string): Promise<void>;
  saveMessages(chatId: string, messages: CoreMessage[]): Promise<void>;
  loadMessages(chatId: string): Promise<CoreMessage[] | null>;
  listChats(): Promise<ChatType[]>; // Changed to return full ChatType objects for easier listing
}

// --- Example FileSystemChatPersistence (requires fs and path to be injected) ---
// This is a structural placeholder. Actual fs/path operations are commented out
// as they can't be executed in this environment directly.
export class FileSystemChatPersistence implements ChatPersistence {
  private CHATS_DIR: string = ".chats"; // Default, should be configurable
  private fs: any; // To be injected: e.g., require('fs/promises')
  private path: any; // To be injected: e.g., require('path')

  constructor(fsModule: any, pathModule: any, baseDir?: string) {
    this.fs = fsModule;
    this.path = pathModule;
    if (baseDir) this.CHATS_DIR = baseDir;
    // In a real scenario, you'd ensure CHATS_DIR exists here
    // this.fs.mkdir(this.path.resolve(this.CHATS_DIR), { recursive: true });
  }

  private getChatPath(chatId: string): string {
    return this.path.join(this.CHATS_DIR, `${chatId}.json`);
  }

  private getMessagesPath(chatId: string): string {
    return this.path.join(this.CHATS_DIR, `${chatId}-messages.json`);
  }
  
  private getChatIndexPath(): string {
    return this.path.join(this.CHATS_DIR, `_chat_index.json`);
  }

  async saveChat(chat: ChatType): Promise<void> {
    // await this.fs.writeFile(this.getChatPath(chat.id), JSON.stringify(chat, null, 2));
    console.log(`[FS P] Save Chat: ${chat.id} (not actually writing to disk in this env)`);
    // Update index
    let index = await this.listChats();
    const existingIndex = index.findIndex(c => c.id === chat.id);
    if (existingIndex > -1) index[existingIndex] = chat;
    else index.push(chat);
    // await this.fs.writeFile(this.getChatIndexPath(), JSON.stringify(index, null, 2));
    (globalThis as any)._chatIndex = index; // For simulation
  }

  async loadChat(chatId: string): Promise<ChatType | null> {
    // try {
    //   const data = await this.fs.readFile(this.getChatPath(chatId), "utf-8");
    //   return JSON.parse(data) as ChatType;
    // } catch (error) {
    //   return null;
    // }
    console.log(`[FS P] Load Chat: ${chatId} (simulating)`);
    const index = await this.listChats(); // Simulate loading from index
    return index.find(c => c.id === chatId) || null;
  }

  async deleteChat(chatId: string): Promise<void> {
    // try { await this.fs.unlink(this.getChatPath(chatId)); } catch (e) { /* ignore */ }
    // try { await this.fs.unlink(this.getMessagesPath(chatId)); } catch (e) { /* ignore */ }
    console.log(`[FS P] Delete Chat: ${chatId} (simulating)`);
    let index = await this.listChats();
    index = index.filter(c => c.id !== chatId);
    // await this.fs.writeFile(this.getChatIndexPath(), JSON.stringify(index, null, 2));
    (globalThis as any)._chatIndex = index; // For simulation
  }

  async saveMessages(chatId: string, messages: CoreMessage[]): Promise<void> {
    // await this.fs.writeFile(this.getMessagesPath(chatId), JSON.stringify(messages, null, 2));
    console.log(`[FS P] Save Messages for Chat: ${chatId}, Count: ${messages.length} (simulating)`);
  }

  async loadMessages(chatId: string): Promise<CoreMessage[] | null> {
    // try {
    //   const data = await this.fs.readFile(this.getMessagesPath(chatId), "utf-8");
    //   return JSON.parse(data) as CoreMessage[];
    // } catch (error) {
    //   return null;
    // }
    console.log(`[FS P] Load Messages for Chat: ${chatId} (simulating empty)`);
    return []; // Simulate no messages or load from a dummy store if needed for testing
  }
  
  async listChats(): Promise<ChatType[]> {
    // try {
    //   const data = await this.fs.readFile(this.getChatIndexPath(), "utf-8");
    //   return JSON.parse(data) as ChatType[];
    // } catch (error) {
    //   return [];
    // }
    console.log(`[FS P] List Chats (simulating empty)`);
    // This should be populated if saveChat has been called
    // For simulation, we need a placeholder for the index if not using actual fs
    if (!(globalThis as any)._chatIndex) (globalThis as any)._chatIndex = [];
    return (globalThis as any)._chatIndex;
  }
}

// --- Zustand Store Definition ---
export interface ChatStoreState {
  chats: Record<string, ChatType>; // Store chats by ID
  messages: Record<string, CoreMessage[]>; // Store messages by chat ID
  activeChatId: string | null;
  persistenceAdapter: ChatPersistence | null;
  isInitialized: boolean;

  // Actions
  _initializePersistence: (adapter: ChatPersistence) => Promise<void>;
  loadChatsFromPersistence: () => Promise<void>;
  setActiveChat: (chatId: string | null) => Promise<void>; // Loads messages for the new active chat
  createChat: (chatData: Omit<ChatType, 'id' | 'primaryContextId' | 'createdAt' | 'updatedAt' | 'taskIds'>, initialMessages?: CoreMessage[]) => Promise<ChatType>;
  addMessage: (chatId: string, message: CoreMessage) => Promise<void>;
  addMessages: (chatId: string, messages: CoreMessage[]) => Promise<void>;
  updateChat: (chatId: string, updates: Partial<ChatType>) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  loadMessagesForChat: (chatId: string) => Promise<void>;
  _internalSetChats: (chats: Record<string, ChatType>) => void;
  _internalSetMessages: (messages: Record<string, CoreMessage[]>) => void;
}

export const useChatStore = create<ChatStoreState>()(
  // Using persist middleware though the actual saving is delegated to the adapter
  // This setup is more for if we wanted Zustand to auto-persist its own state to localStorage
  // For now, we manually call adapter methods.
  (set, get) => ({
    chats: {},
    messages: {},
    activeChatId: null,
    persistenceAdapter: null,
    isInitialized: false,

    _internalSetChats: (chats) => set({ chats }),
    _internalSetMessages: (messages) => set({ messages }),

    _initializePersistence: async (adapter) => {
      set({ persistenceAdapter: adapter, isInitialized: false });
      console.log("ChatStore: Persistence adapter set. Initializing...");
      await get().loadChatsFromPersistence();
      set({ isInitialized: true });
      console.log("ChatStore: Initialized from persistence.");
    },

    loadChatsFromPersistence: async () => {
      const adapter = get().persistenceAdapter;
      if (!adapter) {
        console.warn("ChatStore: No persistence adapter available to load chats.");
        return;
      }
      try {
        const loadedChatsArray = await adapter.listChats();
        const chatsMap: Record<string, ChatType> = {};
        for (const chat of loadedChatsArray) {
          chatsMap[chat.id] = chat;
        }
        set({ chats: chatsMap });
        // Optionally load messages for the active chat if one was persisted
        // Or defer message loading until a chat is explicitly opened
      } catch (error) {
        console.error("ChatStore: Failed to load chats from persistence:", error);
      }
    },

    setActiveChat: async (chatId) => {
      if (get().activeChatId === chatId && chatId !== null && get().messages[chatId]) {
        // Already active and messages likely loaded
        return;
      }
      set({ activeChatId: chatId });
      if (chatId) {
        await get().loadMessagesForChat(chatId);
      }
    },

    loadMessagesForChat: async (chatId) => {
      const adapter = get().persistenceAdapter;
      if (!adapter) {
        console.warn(`ChatStore: No persistence adapter to load messages for chat ${chatId}.`);
        return;
      }
      if (get().messages[chatId]) {
        // console.log(`ChatStore: Messages for chat ${chatId} already in memory.`);
        // return; // Optionally force reload by removing this check
      }
      try {
        const loadedMessages = await adapter.loadMessages(chatId);
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: loadedMessages || [],
          },
        }));
      } catch (error) {
        console.error(`ChatStore: Failed to load messages for chat ${chatId}:`, error);
        set((state) => ({
            messages: { ...state.messages, [chatId]: [] }, // Ensure there's an empty array on error
        }));
      }
    },

    createChat: async (chatData, initialMessages = []) => {
      const adapter = get().persistenceAdapter;
      if (!adapter) throw new Error("ChatStore: Persistence adapter not initialized.");

      const newChat: ChatType = {
        ...chatData,
        id: generateId(),
        primaryContextId: generateId(), // Generate a unique context ID for the chat
        taskIds: [], // Initialize with no tasks
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessagePreview: initialMessages.length > 0 && isTextPart(initialMessages[0].parts[0]) ? initialMessages[0].parts[0].text.substring(0, 50) : "New chat",
        lastMessageTimestamp: initialMessages.length > 0 ? initialMessages[0].metadata.timestamp : new Date().toISOString(),
      };

      set((state) => ({
        chats: { ...state.chats, [newChat.id]: newChat },
        messages: { ...state.messages, [newChat.id]: initialMessages },
      }));

      try {
        await adapter.saveChat(newChat);
        if (initialMessages.length > 0) {
          await adapter.saveMessages(newChat.id, initialMessages);
        }
      } catch (error) {
        console.error("ChatStore: Failed to save new chat to persistence:", error);
        // Optionally roll back state update or mark chat as unsaved
      }
      return newChat;
    },

    addMessage: async (chatId, message) => {
      const adapter = get().persistenceAdapter;
      if (!adapter) throw new Error("ChatStore: Persistence adapter not initialized.");
      if (!get().chats[chatId]) {
        console.error(`ChatStore: Chat ${chatId} does not exist. Cannot add message.`);
        return;
      }
      
      // Ensure message has the chat's primaryContextId if not already set
      const finalMessage = {
          ...message,
          contextId: get().chats[chatId].primaryContextId
      };

      set((state) => {
        const currentMessages = state.messages[chatId] || [];
        // Avoid duplicates if message already exists (e.g. optimistic update + server response)
        const messageExists = currentMessages.find(m => m.messageId === finalMessage.messageId);
        let updatedMessages;
        if (messageExists) {
            updatedMessages = currentMessages.map(m => m.messageId === finalMessage.messageId ? finalMessage : m);
        } else {
            updatedMessages = [...currentMessages, finalMessage];
        }
        return {
          messages: { ...state.messages, [chatId]: updatedMessages },
          // Also update chat's last message preview and timestamp
          chats: {
            ...state.chats,
            [chatId]: {
              ...state.chats[chatId],
              lastMessagePreview: isTextPart(finalMessage.parts[0]) ? finalMessage.parts[0].text.substring(0,50) : "Non-text message",
              lastMessageTimestamp: finalMessage.metadata.timestamp,
              updatedAt: new Date().toISOString(),
            }
          }
        };
      });

      try {
        await adapter.saveMessages(chatId, get().messages[chatId]);
        await adapter.saveChat(get().chats[chatId]); // Save chat to update timestamp/preview in index
      } catch (error) {
        console.error("ChatStore: Failed to save message to persistence:", error);
      }
    },
    
    addMessages: async (chatId, messagesToAdd) => {
        if (messagesToAdd.length === 0) return;
        const adapter = get().persistenceAdapter;
        if (!adapter) throw new Error("ChatStore: Persistence adapter not initialized.");
        if (!get().chats[chatId]) {
            console.error(`ChatStore: Chat ${chatId} does not exist. Cannot add messages.`);
            return;
        }

        const chatPrimaryContextId = get().chats[chatId].primaryContextId;
        const finalMessages = messagesToAdd.map(msg => ({...msg, contextId: chatPrimaryContextId }));

        set(state => {
            const currentMessages = state.messages[chatId] || [];
            const uniqueNewMessages = finalMessages.filter(fm => !currentMessages.find(cm => cm.messageId === fm.messageId));
            const updatedMessages = [...currentMessages, ...uniqueNewMessages].sort((a,b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());
            
            const lastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length -1] : null;

            return {
                messages: { ...state.messages, [chatId]: updatedMessages },
                chats: {
                    ...state.chats,
                    [chatId]: {
                        ...state.chats[chatId],
                        lastMessagePreview: lastMessage && isTextPart(lastMessage.parts[0]) ? lastMessage.parts[0].text.substring(0,50) : state.chats[chatId].lastMessagePreview,
                        lastMessageTimestamp: lastMessage ? lastMessage.metadata.timestamp : state.chats[chatId].lastMessageTimestamp,
                        updatedAt: new Date().toISOString(),
                    }
                }
            };
        });

        try {
            await adapter.saveMessages(chatId, get().messages[chatId]);
            await adapter.saveChat(get().chats[chatId]);
        } catch (error) {
            console.error("ChatStore: Failed to save messages to persistence:", error);
        }
    },

    updateChat: async (chatId, updates) => {
      const adapter = get().persistenceAdapter;
      if (!adapter) throw new Error("ChatStore: Persistence adapter not initialized.");
      if (!get().chats[chatId]) {
        console.error(`ChatStore: Chat ${chatId} not found for update.`);
        return;
      }
      const updatedChat = {
        ...get().chats[chatId],
        ...updates,
        updatedAt: new Date().toISOString(),
      } as ChatType;

      set((state) => ({
        chats: { ...state.chats, [chatId]: updatedChat },
      }));

      try {
        await adapter.saveChat(updatedChat);
      } catch (error) {
        console.error("ChatStore: Failed to save chat updates to persistence:", error);
      }
    },

    deleteChat: async (chatId) => {
      const adapter = get().persistenceAdapter;
      if (!adapter) throw new Error("ChatStore: Persistence adapter not initialized.");

      set((state) => {
        const newChats = { ...state.chats };
        delete newChats[chatId];
        const newMessages = { ...state.messages };
        delete newMessages[chatId];
        return {
          chats: newChats,
          messages: newMessages,
          activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
        };
      });

      try {
        await adapter.deleteChat(chatId);
      } catch (error) {
        console.error("ChatStore: Failed to delete chat from persistence:", error);
      }
    },
  }),
  // If we were using Zustand's own persist middleware for localStorage:
  // {
  //   name: "chat-storage", // unique name
  //   storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
  //   partialize: (state) => ({ activeChatId: state.activeChatId }), // only persist activeChatId for example
  // }
);

// Example of how to initialize with FileSystemChatPersistence in a Node.js environment:
// import fs from 'fs/promises';
// import path from 'path';
// const fsAdapter = new FileSystemChatPersistence(fs, path, './my_app_chats');
// useChatStore.getState()._initializePersistence(fsAdapter);
