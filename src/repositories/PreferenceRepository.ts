import type { Preference, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class PreferenceRepository {
  findByUserId(userId: string): Promise<Preference | null> {
    return prisma.preference.findUnique({ where: { userId } });
  }

  upsert(userId: string, data: Omit<Prisma.PreferenceUncheckedCreateInput, "userId">): Promise<Preference> {
    return prisma.preference.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data
    });
  }
}
