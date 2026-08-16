import { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 não captura rejeições de Promise automaticamente — sem este
// wrapper, um erro assíncrono no controller fica pendurado sem resposta
// em vez de cair no errorHandler. Todo controller async deve passar por aqui.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
