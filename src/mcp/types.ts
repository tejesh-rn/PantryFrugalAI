import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export type MCPServerConfig = {
  id: string;
  name: string;
  url: string;
  headers?: Record<string, string>;
  toolCacheTtlMs: number;
  maxRetries: number;
};

export type MCPToolDefinition = Tool & {
  serverId: string;
};

export type MCPToolCall = {
  serverId: string;
  toolName: string;
  arguments: Record<string, unknown>;
};

export type MCPToolExecution = {
  serverId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  durationMs: number;
};
