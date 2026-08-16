import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Token de autenticação ausente", 401);
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AppError("Token inválido ou expirado", 401);
  }
}
