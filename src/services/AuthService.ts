import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError.js";
import { JwtService } from "./JwtService.js";
import { UserRepository } from "../repositories/UserRepository.js";

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly jwt = new JwtService()
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) throw new AppError("Email is already registered", 409, "EMAIL_EXISTS");

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.users.create({ name: input.name, email, passwordHash });
    const token = this.jwt.sign({ sub: user.id, email: user.email, name: user.name });

    return { user: this.publicUser(user), token };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    const token = this.jwt.sign({ sub: user.id, email: user.email, name: user.name });
    return { user: this.publicUser(user), token };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return this.publicUser(user);
  }

  private publicUser(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
