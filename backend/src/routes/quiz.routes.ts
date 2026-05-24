import { Router } from "express";
import { quizController } from "../controllers/quiz.controller";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

router.post("/start", authenticate, authorize("STUDENT"), quizController.start);
router.post("/answer", authenticate, authorize("STUDENT"), quizController.answer);
router.get("/session/:id", authenticate, authorize("STUDENT"), quizController.getSession);

export default router;
