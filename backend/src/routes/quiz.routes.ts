import { Router } from "express";
import { quizController } from "../controllers/quiz.controller";

const router = Router();

router.post("/start", quizController.start);
router.post("/answer", quizController.answer);
router.get("/session/:id", quizController.getSession);

export default router;
