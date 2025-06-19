import { ToolInvocation } from './ai';

/**
 * Defines the structure for various UI parts that can be rendered in the chat interface,
 * primarily from AI SDK streams.
 */

export type UIPart =
  | TextUIPart
  | ReasoningUIPart
  | ToolInvocationUIPart
  | SourceUIPart
  | StepStartUIPart;

export interface TextUIPart {
  type: 'text';
  text: string;
}

export interface ReasoningUIPart {
  type: 'reasoning';
  reasoning: string;
}

export interface ToolInvocationUIPart {
  type: 'tool-invocation';
  toolInvocation: ToolInvocation;
}

export interface SourceUIPart {
  type: 'source';
  source: any; // Define more strictly if the structure is known
}

export interface StepStartUIPart {
  type: 'step-start';
  step: any; // Define more strictly if the structure is known
} 