import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CoreMessage,
  createCoreMessage,
  sdkMessageToCoreMessage,
  coreMessageToSdkMessage,
} from '../types/message';
import { useChatStore } from '../data/chatStore';
import { Agent } from '../types/agent'; // Your Agent class, ensure it's compatible
import { generateId } from '../lib/utils';
import { Message as VercelAIMessage } from 'ai'; // For AI SDK useChat compatibility if needed for UI
import { ChatType } from '../types/chat';

// --- Chat Orchestrator Interface ---
// This defines the "brain" that can intercept and manage messages and agent interactions.
export interface ChatOrchestrator {
  /**
   * Processes a message initiated by the user.
   * Determines which agents should respond and what initial messages (e.g., user's own message)
   * should be appended to the chat history immediately.
   */
  processOutgoingMessage: (
    chat: ChatType,
    message: CoreMessage, // The user's original message
    currentMessages: CoreMessage[],
    activeAgents: Agent[],
    allAvailableAgents: Agent[],
    currentUserId: string,
  ) => Promise<{
    messagesToAppend: CoreMessage[];
    agentInteractions: Array<{ agent: Agent; requestMessage: CoreMessage }>;
    updatedActiveAgents?: Agent[];
  }>;

  /**
   * Processes responses received from agents.
   * Determines how these responses should be integrated into the chat history.
   */
  processIncomingAgentResponses: (
    chat: ChatType,
    responses: Array<{
      agent: Agent;
      response: CoreMessage; // Expect agents to return CoreMessage compatible structure
      originalRequest: CoreMessage;
    }>,
    currentMessages: CoreMessage[],
    activeAgents: Agent[],
    allAvailableAgents: Agent[],
    currentUserId: string,
  ) => Promise<{
    messagesToAppend: CoreMessage[];
    updatedActiveAgents?: Agent[];
  }>;
}

// --- Basic Orchestrator (Example - to be expanded for complex logic) ---
export const basicOrchestrator: ChatOrchestrator = {
  async processOutgoingMessage(chat, message, currentMessages, activeAgents) {
    // Default: Append the user's message and send it to all active agents.
    return {
      messagesToAppend: [message],
      agentInteractions: activeAgents.map(agent => ({ agent, requestMessage: message })),
    };
  },
  async processIncomingAgentResponses(chat, responses) {
    // Default: Append all agent responses directly.
    return {
      messagesToAppend: responses.map(({ response }) => response),
    };
  },
};

// --- Hook Definition ---
export interface UseChatOptions {
  chatId?: string; // The ID of the chat to load or use
  // initialMessages and initialActiveAgents can be set if creating a new chat implicitly,
  // but generally, chat creation should be explicit via chatStore.
  initialMessagesWhileLoading?: CoreMessage[]; // Messages to display while actual chat loads
  orchestrator?: ChatOrchestrator;
  // chatStore is now accessed via the hook: useChatStore()
  allAvailableAgents: Agent[]; // All agents known to the system for the orchestrator
  currentUserId: string; // ID of the currently logged-in user
}

export function useChat(options: UseChatOptions) {
  const {
    chatId: optionChatId,
    initialMessagesWhileLoading = [],
    orchestrator = basicOrchestrator,
    allAvailableAgents,
    currentUserId,
  } = options;

  // Zustand store selectors
  const storeActiveChatId = useChatStore((state) => state.viewingChatId);
  const storeSetAciveChat = useChatStore((state) => state.activeChat);
  const storeChat = useChatStore((state) => state.viewingChatId ? state.chats[state.viewingChatId] : null);
  const storeMessages = useChatStore((state) => state.viewingChatId ? state.messages[state.viewingChatId] || [] : []);
  const storeAddMessage = useChatStore((state) => state.addMessage);
  const storeAddMessages = useChatStore((state) => state.addMessages);
  const storeCreateChat = useChatStore((state) => state.createChat);
  const storeIsInitialized = useChatStore((state) => state.isLoading);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For chat operations like sending message
  const [isChatLoading, setIsChatLoading] = useState(true); // For initial chat load
  const [activeAgents, setActiveAgents] = useState<Agent[]>([]); // Could be persisted with chat in future
  const [error, setError] = useState<Error | null>(null);

  const isProcessingSubmit = useRef(false);
  const chatIdRef = useRef<string | null | undefined>(optionChatId);

  useEffect(() => {
    chatIdRef.current = optionChatId;
    if (optionChatId && storeIsInitialized) {
      if (optionChatId !== storeActiveChatId || !storeChat) {
          setIsChatLoading(true);
          storeSetAciveChat(optionChatId).finally(() => setIsChatLoading(false));
      } else {
          setIsChatLoading(false);
      }
    } else if (!optionChatId && storeIsInitialized) {
        if(storeActiveChatId !== null) storeSetAciveChat(null);
        setIsChatLoading(false);
    } else if (!storeIsInitialized) {
        setIsChatLoading(true);
    }
  }, [optionChatId, storeSetAciveChat, storeActiveChatId, storeIsInitialized, storeChat]);
  
  // Update active agents if chat changes and we had a way to store them per chat
  // useEffect(() => {
  //    if (storeChat && storeChat.metadata?.activeAgentIds) {
  //        setActiveAgents(allAvailableAgents.filter(a => storeChat.metadata.activeAgentIds.includes(a.id)));
  //    }
  // }, [storeChat, allAvailableAgents]);

  const messagesToDisplay = isChatLoading ? initialMessagesWhileLoading : storeMessages;

  const handleSubmit = async (eOrValue?: React.FormEvent<HTMLFormElement> | { inputValue?: string }) => {
    let currentInputVal = input; // Default to current input state

    if (eOrValue) {
      if ('preventDefault' in eOrValue) {
        eOrValue.preventDefault();
      } // If it has inputValue, it means direct submission
      if ('inputValue' in eOrValue && typeof eOrValue.inputValue === 'string') {
        currentInputVal = eOrValue.inputValue;
      }
    }

    // Ensure storeActiveChatId and storeChat are valid before proceeding
    const currentChatId = storeActiveChatId;
    const currentChat = storeChat;

    if (!currentInputVal.trim() || !currentChatId || !currentChat || isProcessingSubmit.current) return;

    isProcessingSubmit.current = true;
    setIsLoading(true);
    setError(null);

    const userMessage = createCoreMessage({
      content: currentInputVal,
      role: 'user',
      senderId: currentUserId,
      contextId: currentChat.contextId,
    });
    
    // Clear input only if it was not a direct value submission
    if (!eOrValue || !('inputValue' in eOrValue)) {
        setInput('');
    }

    try {
      const outgoingResult = await orchestrator.processOutgoingMessage(
        currentChat, userMessage, storeMessages, activeAgents, allAvailableAgents, currentUserId
      );
      if (outgoingResult.messagesToAppend.length > 0) {
        await storeAddMessages(currentChatId, outgoingResult.messagesToAppend);
      }
      if (outgoingResult.updatedActiveAgents) {
        setActiveAgents(outgoingResult.updatedActiveAgents);
      }

      if (outgoingResult.agentInteractions.length > 0) {
        const agentResponsesPromises = outgoingResult.agentInteractions.map(
          async ({ agent, requestMessage }) => {
            try {
              const responseA2A = await agent.request(requestMessage);
              const responseCore: CoreMessage = {
                  ...responseA2A,
                  id: responseA2A.messageId || generateId(),
                  kind: responseA2A.kind || 'message',
                  role: responseA2A.role || 'agent',
                  metadata: {
                      ...responseA2A.metadata,
                      senderId: agent.id,
                      timestamp: new Date().toISOString(), 
                  },
                  contextId: requestMessage.contextId,
                  taskId: responseA2A.taskId || requestMessage.taskId,
              };
              return { agent, response: responseCore, originalRequest: requestMessage, error: null };
            } catch (err: any) {
              console.error(`Error with agent ${agent.id} (${agent.name}):`, err);
              const errorResponse = createCoreMessage({
                content: `Agent ${agent.name} failed: ${err.message || 'Unknown error'}`,
                role: 'agent',
                senderId: agent.id,
                contextId: currentChat.contextId,
                metadata: { error: true, relatedToMessageId: requestMessage.id }
              });
              return { agent, response: errorResponse, originalRequest: requestMessage, error: err };
            }
          }
        );
        const settledAgentCallResults = await Promise.all(agentResponsesPromises);

        const responsesForOrchestrator = settledAgentCallResults
          .map(r => r.response ? { agent: r.agent, response: r.response, originalRequest: r.originalRequest } : null)
          .filter(r => r !== null) as Array<{ agent: Agent; response: CoreMessage; originalRequest: CoreMessage }>;

        const incomingResult = await orchestrator.processIncomingAgentResponses(
          currentChat, responsesForOrchestrator,
          storeMessages, activeAgents, allAvailableAgents, currentUserId
        );
        if (incomingResult.messagesToAppend.length > 0) {
          await storeAddMessages(currentChatId, incomingResult.messagesToAppend);
        }
        if (incomingResult.updatedActiveAgents) {
          setActiveAgents(incomingResult.updatedActiveAgents);
        }
      }
    } catch (err: any) {
      console.error("Error during chat submission:", err);
      setError(err);
      // Explicitly check currentChatId and currentChat again before use in catch block
      if (currentChatId && currentChat) {
        const errorMessage = createCoreMessage({
          content: `An error occurred: ${err.message}`,
          role: 'agent',
          senderId: 'system-error',
          contextId: currentChat.contextId, 
          metadata: {error: true}
        });
        await storeAddMessage(currentChatId, errorMessage);
      } else {
        console.error("Error during chat submission, but no active chat to report to.");
      }
    } finally {
      setIsLoading(false);
      isProcessingSubmit.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Function to create a new chat and switch to it
  const createAndSwitchToNewChat = async (chatData: Omit<ChatType, 'id' | 'primaryContextId' | 'createdAt' | 'updatedAt' | 'taskIds'>, initialAgents?: Agent[]) => {
    setIsChatLoading(true);
    try {
      const newChat = await storeCreateChat(chatData);
      await storeSetAciveChat(newChat.id);
      if (initialAgents) setActiveAgents(initialAgents);
      setIsChatLoading(false);
      return newChat;
    } catch (err: any) {
      setError(err);
      setIsChatLoading(false);
      throw err;
    }
  };
  
  // Convert CoreMessage to Vercel AI SDK `Message[]` for UI components if needed
  const vercelSdkMessages: VercelAIMessage[] = React.useMemo(() => {
      return messagesToDisplay.map(coreMessageToSdkMessage);
  }, [messagesToDisplay]);

  return {
    chatId: storeActiveChatId,
    chat: storeChat,
    messages: messagesToDisplay, // CoreMessage array
    vercelSdkMessages, // AI SDK compatible messages for UI
    input,
    isLoading, // For message send operations
    isChatLoading, // For loading chat data
    error,
    activeAgents,
    handleInputChange,
    handleSubmit,
    setInput, // Allow external setting of input
    // Expose agent management if orchestrator doesn't fully handle it
    setActiveAgents,
    createAndSwitchToNewChat,
    reloadMessages: async () => { // Force reload messages for current chat
        if(storeActiveChatId) {
            setIsChatLoading(true);
            await useChatStore.getState().loadMessagesForChat(storeActiveChatId);
            setIsChatLoading(false);
        }
    }
  };
}
