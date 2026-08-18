import { Router } from "express";
import { eventsController } from "../controllers/events.controller";
import { validate } from "../../../middlewares/validate";
import { authenticate } from "../../../middlewares/authenticate";
import { authorize } from "../../../middlewares/authorize";
import { asyncHandler } from "../../../utils/asyncHandler";
import { catalogSearchSchema, createEventSchema, searchEventsSchema } from "../dtos/events.dto";

export const eventsRoutes = Router();

// Rotas do organizador — todas exigem autenticação + papel ORGANIZER.
// Vêm antes de "/:id" para não colidir com o parâmetro de rota.
eventsRoutes.get(
  "/catalog",
  authenticate,
  authorize("ORGANIZER"),
  validate(catalogSearchSchema, "query"),
  asyncHandler(eventsController.searchCatalog)
);

eventsRoutes.get(
  "/mine",
  authenticate,
  authorize("ORGANIZER"),
  asyncHandler(eventsController.listMine)
);

eventsRoutes.post(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  validate(createEventSchema),
  asyncHandler(eventsController.create)
);

eventsRoutes.patch(
  "/:id/cancel",
  authenticate,
  authorize("ORGANIZER"),
  asyncHandler(eventsController.cancel)
);

// Rotas públicas — busca e detalhe, usadas pelo cliente.
eventsRoutes.get("/", validate(searchEventsSchema, "query"), asyncHandler(eventsController.list));
eventsRoutes.get("/:id", asyncHandler(eventsController.getById));
