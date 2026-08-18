import { Router } from "express";
import { gateController } from "../controllers/gate.controller";
import { validate } from "../../../middlewares/validate";
import { authenticate } from "../../../middlewares/authenticate";
import { authorize } from "../../../middlewares/authorize";
import { asyncHandler } from "../../../utils/asyncHandler";
import { validateTicketSchema } from "../dtos/gate.dto";

export const gateRoutes = Router();

gateRoutes.use(authenticate, authorize("GATE"));

gateRoutes.post("/validate", validate(validateTicketSchema), asyncHandler(gateController.validate));
