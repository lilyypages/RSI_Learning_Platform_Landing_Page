import { Router } from "express";
import { parentController } from "../controllers/parent.controller";

const router = Router();

router.get("/children", parentController.getChildren);
router.get("/children/:id/summary", parentController.getChildSummary);
router.get("/children/:id/progress", parentController.getChildProgress);
router.get("/messages", parentController.getMessages);

export default router;
