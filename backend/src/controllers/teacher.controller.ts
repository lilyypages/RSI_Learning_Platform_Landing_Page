import { Response, NextFunction } from "express";
import { teacherService } from "../services/teacher.service";
import { AuthRequest } from "../types";
import { z } from "zod";

const createSubjectSchema = z.object({
  name: z.string().min(1, "Nama mapel harus diisi."),
  code: z.string().min(1, "Kode mapel harus diisi."),
});

const createClassSubjectSchema = z.object({
  classId: z.string().uuid("Kelas tidak valid."),
  subjectId: z.string().uuid("Mapel tidak valid."),
  semester: z.number().int().min(1).max(2),
  academicYear: z.number().int(),
});

const createMaterialSchema = z.object({
  classSubjectId: z.string().uuid(),
  title: z.string().min(1, "Judul materi harus diisi."),
  contentText: z.string().optional(),
  orderIndex: z.number().int(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
});

const updateMaterialSchema = z.object({
  title: z.string().min(1).optional(),
  contentText: z.string().optional(),
  orderIndex: z.number().int().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  isPublished: z.boolean().optional(),
});

const createQuestionSchema = z.object({
  materialId: z.string().uuid(),
  questionText: z.string().min(1, "Teks soal harus diisi."),
  options: z.array(z.string()).min(2, "Minimal 2 opsi."),
  correctAnswer: z.string().min(1, "Jawaban benar harus diisi."),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  pointReward: z.number().int().optional(),
  orderIndex: z.number().int(),
});

const updateQuestionSchema = z.object({
  questionText: z.string().min(1).optional(),
  options: z.array(z.string()).min(2).optional(),
  correctAnswer: z.string().min(1).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  pointReward: z.number().int().optional(),
  orderIndex: z.number().int().optional(),
});

async function getStudents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teacherService.getStudents(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getStudentDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teacherService.getStudentDetail(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createSubject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createSubjectSchema.parse(req.body);
    const result = await teacherService.createSubject(parsed);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function getSubjects(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teacherService.getSubjects();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createClassSubject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createClassSubjectSchema.parse(req.body);
    const result = await teacherService.createClassSubject(req.user!.userId, parsed);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function getClassSubjects(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teacherService.getClassSubjects(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getMaterials(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const classSubjectId = req.query.classSubjectId as string;
    const result = await teacherService.getMaterials(classSubjectId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createMaterial(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createMaterialSchema.parse(req.body);
    const result = await teacherService.createMaterial(parsed);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function updateMaterial(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateMaterialSchema.parse(req.body);
    const result = await teacherService.updateMaterial(req.params.id, parsed);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function deleteMaterial(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await teacherService.deleteMaterial(req.params.id);
    res.json({ message: "Materi berhasil dihapus." });
  } catch (err) {
    next(err);
  }
}

async function getQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const materialId = req.query.materialId as string;
    const result = await teacherService.getQuestions(materialId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createQuestionSchema.parse(req.body);
    const result = await teacherService.createQuestion(parsed);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateQuestionSchema.parse(req.body);
    const result = await teacherService.updateQuestion(req.params.id, parsed);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await teacherService.deleteQuestion(req.params.id);
    res.json({ message: "Soal berhasil dihapus." });
  } catch (err) {
    next(err);
  }
}

async function getParents(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teacherService.getParents();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getClasses(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await teacherService.getClasses();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export const teacherController = {
  getStudents, getStudentDetail,
  createSubject, getSubjects,
  createClassSubject, getClassSubjects,
  getParents, getClasses,
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
};
