/**
 * Types related to AI SDK interactions, such as tool calls.
 */

export type ToolInvocation =
  | {
      state: 'partial-call';
      toolCallId: string;
      toolName: string;
      args: any;
    }
  | {
      state: 'call';
      toolCallId: string;
      toolName: string;
      args: any;
    }
  | {
      state: 'result';
      toolCallId: string;
      toolName: string;
      args: any;
      result: any;
    }; 