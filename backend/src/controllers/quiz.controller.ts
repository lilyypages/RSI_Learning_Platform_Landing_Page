import { Response, NextFunction } from "express";
import { quizService } from "../services/quiz.service";
import { AuthRequest } from "../types";
import { z } from "zod";

const startQuizSchema = z.object({
  materialId: z.string().uuid("Material ID tidak valid."),
  classSubjectId: z.string().uuid("Class Subject ID tidak valid."),
});

const answerQuizSchema = z.object({
  sessionId: z.string().uuid("Session ID tidak valid."),
  questionId: z.string().uuid("Question ID tidak valid."),
  answer: z.string().min(1, "Jawaban harus diisi."),
  timeTakenSec: z.number().int().positive().optional(),
});

async function start(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = startQuizSchema.parse(req.body);
    const result = await quizService.startQuiz(
      req.user!.userId,
      parsed.materialId,
      parsed.classSubjectId,
    );
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function answer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = answerQuizSchema.parse(req.body);
    const result = await quizService.answerQuiz(
      req.user!.userId,
      parsed.sessionId,
      parsed.questionId,
      parsed.answer,
      parsed.timeTakenSec,
    );
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function getSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await quizService.getSessionDetail(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export const quizController = { start, answer, getSession };
