import { z } from "zod";

// Registro público só permite CLIENT ou ORGANIZER. O papel GATE (portaria)
// é criado apenas via seed/administração — não faz sentido de negócio alguém
// se autocadastrar como validador de ingresso na entrada de um evento.
export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["CLIENT", "ORGANIZER"]),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
