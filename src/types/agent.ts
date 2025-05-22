// src/types/agent.ts
import { Message, Part, TextPart } from "./a2a";
import { generateText, streamText, LanguageModelV1 } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { xai, createXai } from "@ai-sdk/xai"
import { generateId } from "../lib/utils";

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
  modelProvider: 'openai' | 'gemini' | 'claude' | 'grok';
  model: string;
  apiKey: string; // api key for the model provider
  systemPrompt: string;
}
export type AgentConfig = RemoteAgentConfig | LocalAgentConfig;
/**
 * Represents an AI Agent instance.
 * Remote agent is a A2A agent found and initialized with AgentCard (not implemented yet).
 * Local agent is made with a system prompt and a model via AI SDK.  
 */

export class Agent {
  // uuidv7
  id: string;
  kind: 'local' | 'remote';
  name: string = '';
  description: string = '';
  #agentConfig: AgentConfig;
  #model?: LanguageModelV1; // only used for local agents

  constructor(agentConfig: AgentConfig) {
    this.#agentConfig = agentConfig;
    this.id = agentConfig.id;
    this.kind = agentConfig.kind;
    if (agentConfig.isRetired || !agentConfig.isEnabled) {
      this.name = "Disabled Agent";
      this.description = "This agent is disabled. DO NOT USE IT.";
      return;
    }
    this.#init(agentConfig);
  }
  #init(agentConfig: AgentConfig) {
    if (agentConfig.kind === 'local') {
      this.name = (agentConfig as LocalAgentConfig).name;
      this.description = (agentConfig as LocalAgentConfig).description;
      // TODO: error handling
      this.#model = this.getModel();
    } else {
      // TODO: get name and description from the remote agentCard (not implemented yet)
      this.name = "Remote Agent"; // Default name for remote agents
      this.description = "A remote agent"; // Default description for remote agents
    }
  }
  async request(request: string): Promise<Message> {
    if (this.#agentConfig.kind === "local") {
      const config = this.#agentConfig as LocalAgentConfig;

      // TODO: add streaming
      // TODO: multimodel support
      const { text } = await generateText({
        model: this.#model!,
        prompt: config.systemPrompt + "\n\n" + request,
      });
      let result: Message = {
        messageId: generateId(),
        role: "agent",
        parts: [{ kind: "text", text: text }],
        kind: "message",
      };
      return result;
    } else {
      // TODO: implement remote agent
      return {
        messageId: generateId(),
        role: "agent",
        parts: [{ kind: "text", text: "not implemented yet" }],
        kind: "message",
      };
    }
  }

  /**
   * return LanguageModelV1
   */
  getModel(): LanguageModelV1 {
    if (this.#agentConfig.isRetired || !this.#agentConfig.isEnabled) {
      throw new Error("Agent is retired or disabled");
    }
    if (this.#agentConfig.kind != "local") {
      throw new Error("Agent is not local");
    }
    let model;
    const config = this.#agentConfig as LocalAgentConfig;
    if (config.modelProvider = 'gemini') {
      model = createGoogleGenerativeAI({
        apiKey: config.apiKey,
      })(config.model)
    } else if (config.modelProvider = 'claude') {
      model = createAnthropic({
        apiKey: config.apiKey,
      })(config.model)
    } else if (config.modelProvider = 'openai') {
      model = createOpenAI({
        apiKey: config.apiKey,
      })(config.model)
    } else if (config.modelProvider = 'grok') {
      model = createXai({
        apiKey: config.apiKey,
      })(config.model)
    } else {
      throw new Error("Invalid model provider");
    }
    return model!;
  }

  updateConfig(newConfig: AgentConfig) {
    if (newConfig.id !== this.id) {
      throw new Error('Cannot update agent with different ID');
    }
    if (newConfig.isRetired) {
      this.retire();
      return;
    } else if (!newConfig.isEnabled) {
      this.disable();
      return;
    } else if (newConfig.isEnabled && !this.#agentConfig.isEnabled) {
      this.enable();
    }
    this.#agentConfig = newConfig;
    if (newConfig.kind === 'local') {
      this.name = (newConfig as LocalAgentConfig).name;
      this.description = (newConfig as LocalAgentConfig).description;
    } //: TODO: update remote agent config
  }

  /**
   * if user removes the agent from the config, we should safely remove it after completing the current request.
   * And we should keep its information like memory, etc. for future checks.
   */
  retire() {
    this.#agentConfig.isRetired = true;
    this.name = "Retired Agent";
    this.description = "This agent is retired. DO NOT USE IT.";
  }
  enable() {
    this.#agentConfig.isEnabled = true;
    this.#init(this.#agentConfig);
  }
  disable() {
    this.#agentConfig.isEnabled = false;
    this.name = "Disabled Agent";
    this.description = "This agent is disabled. DO NOT USE IT.";
  }
}

