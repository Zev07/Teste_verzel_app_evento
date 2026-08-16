import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

// Uso: router.post("/", validate(createEventSchema), controller.create)
// O schema valida body por padrão; passe { source: "query" } para validar
// query params quando necessário (ex: filtros de busca).
export function validate(schema: ZodSchema, source: "body" | "query" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    req[source] = schema.parse(req[source]);
    next();
  };
}
