import "dotenv/config";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { authRoutes } from "./modules/auth/routes/auth.routes";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Health check: usado pelo Docker Compose e por qualquer plataforma de deploy
// para saber se o serviço está de pé E consegue falar com o banco.
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    logger.error({ error }, "Health check failed: database unreachable");
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

// TODO: registrar rotas dos módulos aqui conforme forem implementados
app.use("/auth", authRoutes);
// app.use("/events", eventsRoutes);
// app.use("/reservations", reservationsRoutes);
// app.use("/tickets", ticketsRoutes);

// Error handler sempre por último — depois de todas as rotas.
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Backend rodando na porta ${PORT}`);
});
