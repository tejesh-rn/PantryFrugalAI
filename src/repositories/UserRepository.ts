import type { Prisma, User } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class UserRepository {
  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
