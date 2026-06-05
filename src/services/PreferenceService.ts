import { PreferenceRepository } from "../repositories/PreferenceRepository.js";

export class PreferenceService {
  constructor(private readonly preferences = new PreferenceRepository()) {}

  async get(userId: string) {
    const preference = await this.preferences.findByUserId(userId);
    return (
      preference ?? {
        id: null,
        userId,
        monthlyBudget: null,
        dietaryPreferences: [],
        familySize: 1,
        favoriteBrands: [],
        createdAt: null,
        updatedAt: null
      }
    );
  }

  update(
    userId: string,
    input: {
      monthlyBudget?: number | null;
      dietaryPreferences?: string[];
      familySize?: number;
      favoriteBrands?: string[];
    }
  ) {
    return this.preferences.upsert(userId, {
      monthlyBudget: input.monthlyBudget ?? null,
      dietaryPreferences: input.dietaryPreferences ?? [],
      familySize: input.familySize ?? 1,
      favoriteBrands: input.favoriteBrands ?? []
    });
  }
}
