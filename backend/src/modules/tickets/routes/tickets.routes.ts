import { Router } from "express";
import { ticketsController } from "../controllers/tickets.controller";
import { authenticate } from "../../../middlewares/authenticate";
import { authorize } from "../../../middlewares/authorize";
import { asyncHandler } from "../../../utils/asyncHandler";

export const ticketsRoutes = Router();

// Rota pública de compartilhamento — precisa vir antes de "/:id" para não
// ser capturada por ele, e não passa por authenticate (quem recebeu o link
// não tem conta necessariamente).
ticketsRoutes.get("/share/:token", asyncHandler(ticketsController.getByShareToken));

ticketsRoutes.use(authenticate, authorize("CLIENT"));

ticketsRoutes.get("/mine", asyncHandler(ticketsController.listMine));
ticketsRoutes.get("/:id", asyncHandler(ticketsController.getById));
ticketsRoutes.post("/:id/share", asyncHandler(ticketsController.share));
