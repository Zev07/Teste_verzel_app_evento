import pino from "pino";

// Logger estruturado: em dev usa formato legível, em produção usa JSON puro
// (mais fácil de agregar em qualquer plataforma de log).
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
