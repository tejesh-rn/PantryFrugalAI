import type OpenAI from "openai";
import { MessageRole, type Message } from "@prisma/client";
import { logger } from "../config/logger.js";
import { MCPService } from "../mcp/MCPService.js";
import { buildSystemPrompt } from "../prompts/systemPrompt.js";
import { ConversationService } from "./ConversationService.js";
import { aiProvider, openai } from "./OpenAIService.js";
import { PreferenceService } from "./PreferenceService.js";

const MAX_TOOL_ROUNDS = 6;
const HISTORY_LIMIT = 24;

export class ChatService {
  constructor(
    private readonly preferences = new PreferenceService(),
    private readonly conversations = new ConversationService(),
    private readonly mcp = new MCPService()
  ) {}

  async chat(userId: string, input: { message: string; conversationId?: string }) {
    const preference = await this.preferences.get(userId);
    const isNewConversation = !input.conversationId;
    const conversation = await this.conversations.ensureConversation(userId, input.conversationId, input.message);
    await this.conversations.addUserMessage(conversation.id, input.message);

    const loadedConversation = await this.conversations.get(conversation.id, userId);
    const tools = await this.mcp.getOpenAITools();

    if (tools.length === 0 && this.requiresLiveQuickCommerce(input.message)) {
      const response = this.buildQuickCommerceSetupMessage();
      await this.conversations.addAssistantMessage(conversation.id, response, [], {
        provider: aiProvider.name,
        model: aiProvider.model,
        mcpConfigured: this.mcp.isConfigured(),
        mcpToolCount: 0
      });
      await this.conversations.touch(conversation.id);

      if (isNewConversation) {
        this.generateTitle(conversation.id, input.message, response).catch(() => {});
      }

      return {
        conversationId: conversation.id,
        response,
        toolCalls: [],
        metadata: {
          model: aiProvider.model,
          provider: aiProvider.name,
          usage: null,
          mcpToolCount: 0,
          mcpConfigured: this.mcp.isConfigured()
        }
      };
    }

    const messages = this.buildMessages(preference, loadedConversation.messages);

    const toolExecutions: Array<Record<string, unknown>> = [];
    let completion: OpenAI.Chat.Completions.ChatCompletion | undefined;

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const startedAt = Date.now();
      completion = await openai.chat.completions.create({
        model: aiProvider.model,
        messages,
        ...(tools.length > 0 ? { tools, tool_choice: "auto" as const } : {}),
        temperature: 0.2
      });

      logger.info("AI chat completion", {
        provider: aiProvider.name,
        model: aiProvider.model,
        durationMs: Date.now() - startedAt,
        conversationId: conversation.id,
        toolCount: tools.length,
        finishReason: completion.choices[0]?.finish_reason
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) throw new Error("OpenAI returned no assistant message");
      messages.push(assistantMessage);

      const toolCalls = assistantMessage.tool_calls ?? [];
      if (toolCalls.length === 0) {
        const response = await this.ensureAssistantResponse(messages, assistantMessage.content, toolExecutions);
        await this.conversations.addAssistantMessage(conversation.id, response, toolExecutions, {
          model: completion.model,
          usage: completion.usage ?? null
        });
        await this.conversations.touch(conversation.id);

        if (isNewConversation) {
          this.generateTitle(conversation.id, input.message, response).catch(() => {});
        }

        return {
          conversationId: conversation.id,
          response,
          toolCalls: toolExecutions,
          metadata: {
            model: completion.model,
            provider: aiProvider.name,
            usage: completion.usage ?? null,
            mcpToolCount: tools.length
          }
        };
      }

      for (const toolCall of toolCalls) {
        const execution = await this.executeToolForModel(toolCall);
        toolExecutions.push(execution as Record<string, unknown>);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(execution.result ?? execution)
        });
      }
    }

    throw new Error(`${aiProvider.name} exceeded maximum MCP tool rounds`);
  }

  private async ensureAssistantResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    content: OpenAI.Chat.Completions.ChatCompletionMessage["content"],
    toolExecutions: Array<Record<string, unknown>>
  ) {
    const response = this.normalizeAssistantContent(content);
    if (response) return response;

    logger.warn("AI returned an empty assistant response; requesting final text", {
      provider: aiProvider.name,
      model: aiProvider.model,
      toolExecutionCount: toolExecutions.length
    });

    const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      ...messages,
      {
        role: "user",
        content:
          "Provide the final user-facing answer now. Do not call any tools. If live grocery data was unavailable or incomplete, say what could not be verified and ask for the missing detail."
      }
    ];

    const completion = await openai.chat.completions.create({
      model: aiProvider.model,
      messages: finalMessages,
      temperature: 0.2
    });

    const finalResponse = this.normalizeAssistantContent(completion.choices[0]?.message?.content ?? null);
    if (finalResponse) return finalResponse;

    return this.buildEmptyResponseFallback(toolExecutions);
  }

  private normalizeAssistantContent(content: OpenAI.Chat.Completions.ChatCompletionMessage["content"]) {
    return typeof content === "string" ? content.trim() : "";
  }

  private buildEmptyResponseFallback(toolExecutions: Array<Record<string, unknown>>) {
    if (toolExecutions.length === 0) {
      return "I couldn't generate a response for that request. Could you share your exact location coordinates (latitude and longitude)? This helps me pull accurate, real-time prices for stores near you.";
    }

    const allErrored = toolExecutions.every((execution) => execution.error === true);
    if (allErrored) {
      return "I couldn't retrieve live grocery data for your location. Could you please share your exact latitude and longitude coordinates? Pincode alone sometimes isn't precise enough for the quick commerce APIs.";
    }

    return "I completed the live grocery lookup, but couldn't format a final answer. Please try the request again, or narrow it to one store or ingredient list.";
  }

  private requiresLiveQuickCommerce(message: string) {
    return [
      /\bpincode\b/i,
      /\bblinkit\b/i,
      /\binstamart\b/i,
      /\bzepto\b/i,
      /\bdunzo\b/i,
      /\bbigbasket\b/i,
      /\bquick\s*commerce\b/i,
      /\blive\s+(price|prices|pricing|availability)\b/i,
      /\b(price|prices|cost|checkout|availability)\b/i
    ].some((pattern) => pattern.test(message));
  }

  private buildQuickCommerceSetupMessage() {
    return [
      "QuickCommerce live pricing is not configured on this backend yet.",
      "",
      "Add your hosted MCP API key to the backend `.env` and restart the server:",
      "",
      "```text",
      "QUICKCOMMERCE_MCP_URL=https://api.quickcommerceapi.com/mcp",
      "QUICKCOMMERCE_API_KEY=your-api-key-here",
      "```",
      "",
      "After that, I can call the QuickCommerce MCP tools for live prices and availability instead of guessing."
    ].join("\n");
  }

  private buildMessages(
    preferences: Awaited<ReturnType<PreferenceService["get"]>>,
    history: Message[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const recentHistory = history.slice(-HISTORY_LIMIT);
    const systemPrompt = buildSystemPrompt({
      preferences: {
        monthlyBudget: preferences.monthlyBudget,
        dietaryPreferences: preferences.dietaryPreferences,
        familySize: preferences.familySize,
        favoriteBrands: preferences.favoriteBrands
      }
    });

    return [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((message) => ({
        role: message.role === MessageRole.user ? ("user" as const) : ("assistant" as const),
        content: message.content
      }))
    ];
  }

  private async executeToolForModel(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
    try {
      return await this.mcp.executeOpenAITool(toolCall.function.name, toolCall.function.arguments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "MCP tool call failed";
      logger.warn("MCP tool call returned to model as error", {
        toolName: toolCall.function.name,
        error
      });

      return {
        toolName: toolCall.function.name,
        arguments: toolCall.function.arguments,
        error: true,
        result: {
          error: message,
          instruction: "Live grocery data could not be retrieved. Do NOT give generic store recommendations. Instead, ask the user to provide their exact latitude and longitude coordinates so you can retry with precise location data."
        }
      };
    }
  }

  private async generateTitle(conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      const truncatedResponse = assistantResponse.length > 500 ? assistantResponse.slice(0, 500) : assistantResponse;
      const completion = await openai.chat.completions.create({
        model: aiProvider.model,
        messages: [
          {
            role: "system",
            content: "Generate a short, concise title (maximum 6 words) that summarizes the conversation topic. Return ONLY the title text, nothing else. No quotes, no punctuation at the end."
          },
          {
            role: "user",
            content: `User asked: ${userMessage}\n\nAssistant replied: ${truncatedResponse}`
          }
        ],
        temperature: 0.3
      });

      const title = completion.choices[0]?.message?.content?.trim();
      if (title && title.length > 0 && title.length <= 80) {
        await this.conversations.updateTitle(conversationId, title);
        logger.info("Generated conversation title", { conversationId, title });
      }
    } catch (error) {
      logger.warn("Failed to generate conversation title", { conversationId, error });
    }
  }
}
