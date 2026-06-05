import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import type { MCPServerConfig } from "./types.js";

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export class MCPClient {
  private sessionId?: string;
  private initialized = false;
  private initializing?: Promise<void>;
  private requestId = 0;

  constructor(private readonly config: MCPServerConfig) {}

  async listTools(): Promise<Tool[]> {
    await this.connect();
    return this.withRetry("tools/list", async () => {
      const startedAt = Date.now();
      const result = await this.request<{ tools: Tool[] }>("tools/list", {});
      logger.info("MCP tools discovered", {
        serverId: this.config.id,
        count: result.tools.length,
        durationMs: Date.now() - startedAt
      });
      return result.tools;
    });
  }

  async callTool(name: string, args: Record<string, unknown>) {
    await this.connect();
    return this.withRetry(`tools/call:${name}`, async () => {
      const startedAt = Date.now();
      logger.info("MCP tool call started", { serverId: this.config.id, toolName: name, arguments: this.redactSecrets(args) });
      const result = await this.request<Record<string, unknown>>("tools/call", { name, arguments: args });
      logger.info("MCP tool call completed", {
        serverId: this.config.id,
        toolName: name,
        durationMs: Date.now() - startedAt,
        isError: result.isError
      });
      return result;
    });
  }

  async close(): Promise<void> {
    this.sessionId = undefined;
    this.initialized = false;
  }

  private async connect(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this.initialize().finally(() => {
      this.initializing = undefined;
    });
    return this.initializing;
  }

  private async initialize(): Promise<void> {
    const result = await this.send<{ serverInfo?: unknown; protocolVersion?: string }>("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: `pantry-frugal-ai-${this.config.id}`, version: "1.0.0" }
    });

    await this.sendNotification("notifications/initialized", {});
    this.initialized = true;
    logger.info("MCP connected", {
      serverId: this.config.id,
      transportType: "streamable-http-jsonrpc",
      protocolVersion: result.protocolVersion
    });
  }

  private request<T>(method: string, params: Record<string, unknown>): Promise<T> {
    return this.send<T>(method, params);
  }

  private async send<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const id = ++this.requestId;
    const response = await this.fetchWithTimeout(method, {
      method: "POST",
      headers: this.headers(true),
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
    });

    this.captureSession(response);
    const message = await this.parseResponse<T>(response);

    if (message.error) {
      throw new Error(`MCP ${method} failed: ${message.error.message}`);
    }
    if (message.result === undefined) {
      throw new Error(`MCP ${method} returned no result`);
    }

    return message.result;
  }

  private async sendNotification(method: string, params: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithTimeout(method, {
      method: "POST",
      headers: this.headers(true),
      body: JSON.stringify({ jsonrpc: "2.0", method, params })
    });

    this.captureSession(response);
    if (!response.ok) {
      throw new Error(`MCP ${method} notification failed with HTTP ${response.status}: ${await response.text()}`);
    }
    await response.body?.cancel();
  }

  private headers(includeSession: boolean): HeadersInit {
    return {
      ...this.config.headers,
      ...(includeSession && this.sessionId ? { "mcp-session-id": this.sessionId } : {}),
      "content-type": "application/json",
      accept: "application/json, text/event-stream"
    };
  }

  private captureSession(response: Response) {
    const sessionId = response.headers.get("mcp-session-id");
    if (sessionId) this.sessionId = sessionId;
  }

  private async parseResponse<T>(response: Response): Promise<JsonRpcResponse<T>> {
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      return this.parseSseMessage<T>(text);
    }

    return JSON.parse(text) as JsonRpcResponse<T>;
  }

  private parseSseMessage<T>(text: string): JsonRpcResponse<T> {
    const dataLines = text
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trimStart());

    if (dataLines.length === 0) {
      throw new Error("MCP SSE response did not include a data event");
    }

    return JSON.parse(dataLines.join("\n")) as JsonRpcResponse<T>;
  }

  private async withRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn("MCP operation failed", {
          serverId: this.config.id,
          operation,
          attempt,
          maxRetries: this.config.maxRetries,
          error
        });

        if (this.isTimeoutError(error)) throw error;

        await this.close();
        await this.connect();
        if (attempt < this.config.maxRetries) await this.delay(250 * 2 ** attempt);
      }
    }

    throw new AppError("MCP operation failed", 502, "MCP_OPERATION_FAILED", lastError);
  }

  private async fetchWithTimeout(method: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.MCP_REQUEST_TIMEOUT_MS);

    try {
      return await fetch(this.config.url, {
        ...init,
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(
          `MCP ${method} timed out after ${env.MCP_REQUEST_TIMEOUT_MS}ms`,
          504,
          "MCP_REQUEST_TIMEOUT",
          { serverId: this.config.id, method, timeoutMs: env.MCP_REQUEST_TIMEOUT_MS }
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isTimeoutError(error: unknown) {
    return error instanceof AppError && error.code === "MCP_REQUEST_TIMEOUT";
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private redactSecrets(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.redactSecrets(item));

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
          key,
          /api[_-]?key|token|secret|password/i.test(key) ? "[redacted]" : this.redactSecrets(nestedValue)
        ])
      );
    }

    return value;
  }
}
