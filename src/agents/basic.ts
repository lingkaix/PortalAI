import { Agent } from '../types/agent';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

/**
 * Creates a basic AI agent with the specified configuration
 */
export function createBasicAgent(config: Omit<Agent, 'messages'>): Agent {
  return {
    ...config,
    messages: [], // Initialize empty message history
  };
}

/**
 * Handles a conversation with the agent
 */
export async function* chatWithAgent(agent: Agent, userMessage: string) {
  // Add user message to history
  agent.messages = agent.messages || [];
  agent.messages.push({ role: 'user', content: userMessage });

  // Stream the response
  const result = streamText({
    model: openai(agent.model),
    system: agent.systemPrompt,
    messages: agent.messages,
    maxSteps: agent.maxSteps,
    temperature: agent.temperature,
    tools: agent.tools,
  });

  // Stream the response back
  for await (const chunk of result.textStream) {
    yield chunk;
  }

  // Add assistant's response to history
  const fullResponse = await result.text;
  agent.messages.push({ role: 'assistant', content: fullResponse });
}

// Example usage:
/*
const agent = createBasicAgent({
  id: 'basic-assistant',
  a2a: { /* your agent card config */ },
  systemPrompt: 'You are a helpful AI assistant.',
  model: 'gpt-4',
  temperature: 0.7,
  maxSteps: 5,
});

// Use the agent
for await (const chunk of chatWithAgent(agent, 'Hello!')) {
  console.log(chunk);
}
*/
