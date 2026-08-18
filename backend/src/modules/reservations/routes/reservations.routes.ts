import { Router } from "express";
import { reservationsController } from "../controllers/reservations.controller";
import { validate } from "../../../middlewares/validate";
import { authenticate } from "../../../middlewares/authenticate";
import { authorize } from "../../../middlewares/authorize";
import { asyncHandler } from "../../../utils/asyncHandler";
import { createReservationSchema } from "../dtos/reservations.dto";

export const reservationsRoutes = Router();

// Todas as rotas de reserva exigem autenticação + papel CLIENT.
reservationsRoutes.use(authenticate, authorize("CLIENT"));

reservationsRoutes.post("/", validate(createReservationSchema), asyncHandler(reservationsController.create));
reservationsRoutes.get("/mine", asyncHandler(reservationsController.listMine));
reservationsRoutes.get("/:id", asyncHandler(reservationsController.getById));
