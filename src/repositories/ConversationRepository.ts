import { MessageRole, type Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class ConversationRepository {
  listByUserId(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } }
      }
    });
  }

  create(userId: string, title?: string) {
    return prisma.conversation.create({ data: { userId, title } });
  }

  deleteByIdForUser(id: string, userId: string) {
    return prisma.conversation.deleteMany({ where: { id, userId } });
  }

  addMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    toolCalls?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.message.create({ data });
  }

  touch(id: string) {
    return prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  updateTitle(id: string, title: string) {
    return prisma.conversation.update({ where: { id }, data: { title } });
  }
}
