import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../../../middlewares/validate";
import { asyncHandler } from "../../../utils/asyncHandler";
import { loginSchema, registerSchema } from "../dtos/auth.dto";
import { loginLimiter } from "../../../middlewares/rateLimiter";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), asyncHandler(authController.register));
authRoutes.post("/login", validate(loginSchema), asyncHandler(authController.login));

authRoutes.post("/login", loginLimiter, authController.login);
authRoutes.post("/register", authController.register);