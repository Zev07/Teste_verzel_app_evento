import { Role } from "@prisma/client";

// Permite acessar req.user com tipagem em qualquer rota autenticada,
// sem precisar de "as any" espalhado pelo código.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

export {};
