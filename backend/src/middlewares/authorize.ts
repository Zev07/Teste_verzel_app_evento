import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

// Uso: router.post("/", authenticate, authorize("ORGANIZER"), controller.create)
// Sempre usado depois de authenticate — nunca sozinho, já que depende de req.user.
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Não autenticado", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Você não tem permissão para executar esta ação", 403);
    }

    next();
  };
}
