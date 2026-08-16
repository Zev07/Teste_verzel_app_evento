import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { signToken } from "../../../utils/jwt";
import { LoginInput, RegisterInput } from "../dtos/auth.dto";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      throw new AppError("Já existe uma conta com este email", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
    });

    const token = signToken({ sub: user.id, role: user.role });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Mensagem genérica de propósito: não revelar se o email existe ou não,
    // para não facilitar enumeração de contas cadastradas.
    if (!user) {
      throw new AppError("Email ou senha inválidos", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("Email ou senha inválidos", 401);
    }

    const token = signToken({ sub: user.id, role: user.role });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
};
