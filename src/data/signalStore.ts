import { create } from 'zustand';
import { streamText } from 'ai';
import { useChatStore } from './chatStore';
import { AgentIsWorkingSignal } from '../types/signal';
import { newContentMessage } from '../lib/message';
import { ContentMessage, TextPart } from '../types';
import { useAgentStore } from './agentStore';

interface SignalStoreState {
  // A map of active "agent is working" signals, keyed by chatId.
  // This holds the incomplete, streaming message from the agent.
  agentWorkingSignals: Map<string, AgentIsWorkingSignal[]>;

  // registered hooks before sending message
  // we can add prompt, extra context, etc. here
  _hooksBeforeSendMessage: Map<string, (messageParts: TextPart[]) => Promise<TextPart[]>>;
  registerBeforeSendMessageHook: (key: string, hook: (messageParts: TextPart[]) => Promise<TextPart[]>) => void;
  removeBeforeSendMessageHook: (key: string) => void;

  // registered hooks after receiving message (before storing to db)
  _hooksAfterReceiveMessage: Map<string, (message: Partial<ContentMessage>) => Promise<Partial<ContentMessage>>>;
  registerAfterReceiveMessageHook: (key: string,
    hook: (message: Partial<ContentMessage>) => Promise<Partial<ContentMessage>>) => void;
  removeAfterReceiveMessageHook: (key: string) => void;

  // only use to trigger state update and re-render
  updateTrigger: boolean;
  _update: () => void;

  // The primary method for the UI to send a message. 
  // currently text only
  userSendMessage: (
    chatId: string,
    messageContent: string,
    agentId: string
  ) => Promise<void>;
}

export const useSignalStore = create<SignalStoreState>((set, get) => ({
  updateTrigger: true,
  _update: () => {
    set(state => {
      return { updateTrigger: !state.updateTrigger };
    });
  },
  agentWorkingSignals: new Map(),
  _hooksBeforeSendMessage: new Map(),
  _hooksAfterReceiveMessage: new Map(),

  // functions below changes hook maps , BUT WON'T trigger state update
  registerBeforeSendMessageHook: (key, hook) => {
    if (get()._hooksBeforeSendMessage.has(key)) {
      console.warn(`Hook with key ${key} already registered`);
      return;
    } else {
      get()._hooksBeforeSendMessage.set(key, hook)
    }
  },
  registerAfterReceiveMessageHook: (key, hook) => {
    if (get()._hooksAfterReceiveMessage.has(key)) {
      console.warn(`Hook with key ${key} already registered`);
      return;
    } else {
      get()._hooksAfterReceiveMessage.set(key, hook)
    }
  },
  removeBeforeSendMessageHook: (key) => {
    get()._hooksBeforeSendMessage.delete(key)
  },
  removeAfterReceiveMessageHook: (key) => {
    get()._hooksAfterReceiveMessage.delete(key)
  },

  // now only support local agent
  userSendMessage: async (chatId, messageContent, agentId) => {
    const { addMessage, chats, workspaceId } = useChatStore.getState();
    const chat = chats[chatId];
    if (!chat) {
      console.error(`Cannot send message: chat with ID ${chatId} not found.`);
      return;
    }
    const { channelId } = chat;

    // get agent config from agentStore
    const agentConfig = useAgentStore.getState().agentConfigs.get(agentId);
    if (!agentConfig) {
      console.error(`Cannot send message: agent with ID ${agentId} not found.`);
      return;
    }

    // 1. Create and persist the user's message immediately.
    const userMessage = newContentMessage({
      chatId,
      workspaceId,
      channelId,
      senderId: '0000', // assuming a single user for now
      senderType: 'user',
      payload: [{ kind: 'text', text: messageContent } as TextPart],
      networkState: 'received',
    });
    addMessage(userMessage);

    // 2. Prepare for the AI's response by creating a working signal.
    const agentMessageShell: Partial<ContentMessage> = {
      id: undefined, // will be determined when inserting to db
      chatId,
      workspaceId,
      channelId,
      senderId: agentId,
      senderType: 'agent',
      payload: [{ kind: 'text', text: '' } as TextPart],
      networkState: 'receiving_stream',
      replyTo: userMessage.id,
      timestamp: Date.now(),
    };

    const workingSignal: AgentIsWorkingSignal = {
      type: 'agent_is_working',
      chatId,
      payload: {
        agentId,
        partialMessage: agentMessageShell,
      },
    };

    const currentSignals = get().agentWorkingSignals.get(chatId) || [];
    get().agentWorkingSignals.set(chatId, [...currentSignals, workingSignal]);
    get()._update();

    let messages: TextPart[] = [{ kind: 'text', text: messageContent }]
    // ---- apply hooks before sending message ----
    const beforeSendMessageHooks = get()._hooksBeforeSendMessage.values();
    for (const hook of beforeSendMessageHooks) {
      messages = await hook(messages)
    }

    const localAgent = useAgentStore.getState().getLocalAgent(agentId);
    // 3. Call the AI SDK to get the streaming response.
    try {
      const result = await streamText({
        model: localAgent!.model,
        system: localAgent!.systemPrompt,
        messages: messages.map(part => ({
          role: 'user',
          content: part.text,
        })),
      });

      // 4. Handle the streaming text delta.
      const reader = result.textStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        workingSignal.payload.textCache += value;
        get()._update();
      }

      // 5. trigger hooks and add message to ChatStore
      agentMessageShell.payload = [{ kind: 'text', text: workingSignal.payload.textCache } as TextPart];
      workingSignal.payload.partialMessage = agentMessageShell;

      const afterReceiveMessageHooks = get()._hooksAfterReceiveMessage.values();
      for (const hook of afterReceiveMessageHooks) {
        workingSignal.payload.partialMessage = await hook(workingSignal.payload.partialMessage);
      }
      addMessage(workingSignal.payload.partialMessage as ContentMessage);

      // 6. Clean up the working signal.
      set(state => {
        const newSignals = new Map(state.agentWorkingSignals);
        newSignals.delete(chatId);
        return { agentWorkingSignals: newSignals };
      })

    } catch (error) {
      console.error("Error during AI stream:", error);
      // Create an error message in the chat.
      const errorMessage = newContentMessage({
        chatId,
        workspaceId,
        channelId,
        senderId: 'system',
        senderType: 'system',
        payload: [{ kind: 'text', text: `An error occurred: ${(error as Error).message}` } as TextPart],
        networkState: 'failed',
      });
      addMessage(errorMessage);

      // Clean up the working signal on error.
      set(state => {
        const newSignals = new Map(state.agentWorkingSignals);
        newSignals.delete(chatId);
        return { agentWorkingSignals: newSignals };
      });
    }
  },
}));
