import { LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai"

export function getModel(provider: string, model: string, apiKey: string): LanguageModelV1 {
  if (provider === 'google') {
    return createGoogleGenerativeAI({
      apiKey: apiKey,
    })(model)
  } else if (provider === 'openai') {
    return createOpenAI({
      apiKey: apiKey,
    })(model)
  } else if (provider === 'anthropic') {
    return createAnthropic({
      apiKey: apiKey,
    })(model)
  } else if (provider === 'xai') {
    return createXai({
      apiKey: apiKey,
    })(model)
  } else {
    throw new Error(`Unsupported model provider: ${provider}`);
  }
}