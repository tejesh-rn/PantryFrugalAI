import { MessageRole, Prisma } from "@prisma/client";
import { ConversationRepository } from "../repositories/ConversationRepository.js";
import { AppError } from "../utils/AppError.js";

export class ConversationService {
  constructor(private readonly conversations = new ConversationRepository()) {}

  list(userId: string) {
    return this.conversations.listByUserId(userId);
  }

  async get(id: string, userId: string) {
    const conversation = await this.conversations.findByIdForUser(id, userId);
    if (!conversation) throw new AppError("Conversation not found", 404, "CONVERSATION_NOT_FOUND");
    return conversation;
  }

  async delete(id: string, userId: string) {
    const result = await this.conversations.deleteByIdForUser(id, userId);
    if (result.count === 0) throw new AppError("Conversation not found", 404, "CONVERSATION_NOT_FOUND");
  }

  async ensureConversation(userId: string, conversationId: string | undefined, firstMessage: string) {
    if (conversationId) return this.get(conversationId, userId);
    const title = firstMessage.length > 80 ? `${firstMessage.slice(0, 77)}...` : firstMessage;
    return this.conversations.create(userId, title);
  }

  addUserMessage(conversationId: string, content: string) {
    return this.conversations.addMessage({ conversationId, role: MessageRole.user, content });
  }

  addAssistantMessage(conversationId: string, content: string, toolCalls: unknown[], metadata: Record<string, unknown>) {
    return this.conversations.addMessage({
      conversationId,
      role: MessageRole.assistant,
      content,
      toolCalls: toolCalls as Prisma.InputJsonValue,
      metadata: metadata as Prisma.InputJsonValue
    });
  }

  touch(conversationId: string) {
    return this.conversations.touch(conversationId);
  }

  updateTitle(conversationId: string, title: string) {
    return this.conversations.updateTitle(conversationId, title);
  }
}
