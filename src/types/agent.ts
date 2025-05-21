// src/types/agent.ts
import { AgentCard } from "./a2a";
import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai"

export type RemoteAgent = {
  id: string;
  kind: 'remote';
  a2a: AgentCard;
}

export type LocalAgent = {
  id: string;
  kind: 'local';
  modelProvider: 'openai' | 'gemini' | 'claude' | 'grok';
  model: string;
  systemPrompt: string;
  // TODO: tools, memory, etc.
}

/**
 * Represents an AI Agent.
 * Remote agent is a A2A agent found and initialized with AgentCard (not implemented yet).
 * Local agent is made with a system prompt and a model via AI SDK.  
 */
export class Agent {
  #agentConfig: LocalAgent | RemoteAgent;
  constructor(public agent: LocalAgent | RemoteAgent) {
    this.#agentConfig = agent;
  }
  async request(request: string): Promise<string> {
    if (this.#agentConfig.kind === 'local') {
      // Use AI SDK to send the request to the model
      let model;
      if (this.#agentConfig.modelProvider === 'openai') {
        model = openai(this.#agentConfig.model);
      } else if (this.#agentConfig.modelProvider === 'claude') {
        model = anthropic(this.#agentConfig.model);
      } else if (this.#agentConfig.modelProvider === 'gemini') {
        model = google(this.#agentConfig.model);
      } else if (this.#agentConfig.modelProvider === 'grok') {
        model = xai(this.#agentConfig.model);
      }
      const { text } = await generateText({
        model: model!,
        prompt: this.#agentConfig.systemPrompt + "\n\n" + request,
      });
      return text;
    } else {
      return 'Not implemented';
    }
  }
}