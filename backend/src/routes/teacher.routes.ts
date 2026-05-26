import { Router } from "express";
import { teacherController } from "../controllers/teacher.controller";

const router = Router();

router.get("/students", teacherController.getStudents);
router.get("/students/:id/detail", teacherController.getStudentDetail);
router.post("/subjects", teacherController.createSubject);
router.get("/subjects", teacherController.getSubjects);
router.post("/class-subjects", teacherController.createClassSubject);
router.get("/class-subjects", teacherController.getClassSubjects);
router.get("/materials", teacherController.getMaterials);
router.post("/materials", teacherController.createMaterial);
router.put("/materials/:id", teacherController.updateMaterial);
router.delete("/materials/:id", teacherController.deleteMaterial);
router.get("/parents", teacherController.getParents);
router.get("/classes", teacherController.getClasses);
router.get("/questions", teacherController.getQuestions);
router.post("/questions", teacherController.createQuestion);
router.put("/questions/:id", teacherController.updateQuestion);
router.delete("/questions/:id", teacherController.deleteQuestion);

export default router;
