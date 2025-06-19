/**
 * Represents an AI Agent instance.
 * Remote agent is a A2A agent found and initialized with AgentCard (not implemented yet).
 * Local agent is made with a system prompt and a model via AI SDK.  
 */

export type AgentConfigBase = {
  id: string;
  // user can temporarily disable the agent
  isEnabled: boolean;
  // user can permanently remove the agent, but we should keep its information like memory, etc. for future checks.
  isRetired: boolean;
  memory?: string; //TODO: add memory
}
export type RemoteAgentConfig = AgentConfigBase & {
  kind: 'remote';
  // A URL to the address the agent is hosted at.
  url: string;
  // api key to access the agent
  apiKey: string;
}

export type LocalAgentConfig = AgentConfigBase & {
  name: string;
  description: string;
  kind: 'local';
  provider: 'openai' | 'google' | 'anthropic' | 'xai';
  model: string;
  apiKey: string; // api key for the model provider
  systemPrompt: string;
}

export type AgentConfig = RemoteAgentConfig | LocalAgentConfig;


