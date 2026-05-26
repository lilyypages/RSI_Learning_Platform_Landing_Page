import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/register", authenticate, authorize("PRINCIPAL"), authController.register);
router.post("/logout", authenticate, authController.logout);
router.post("/change-password", authenticate, authController.changePassword);
router.get("/me", authenticate, authController.me);

export default router;
