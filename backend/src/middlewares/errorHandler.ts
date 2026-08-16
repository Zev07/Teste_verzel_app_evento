import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// Formato único de erro em toda a API: { error: { message, details? } }.
// Nenhuma rota deve montar sua própria resposta de erro — sempre chamar
// next(err) e deixar este handler decidir o formato e o status HTTP.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        message: "Dados inválidos",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message } });
  }

  // Erro não previsto: loga completo internamente, mas nunca expõe stack
  // trace ou detalhe interno na resposta ao cliente.
  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({ error: { message: "Erro interno do servidor" } });
}
