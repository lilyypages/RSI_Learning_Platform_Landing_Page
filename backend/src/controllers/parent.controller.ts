import { Response, NextFunction } from "express";
import { parentService } from "../services/parent.service";
import { AuthRequest } from "../types";

async function getChildren(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await parentService.getChildren(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getChildSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await parentService.getChildSummary(req.user!.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getChildProgress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await parentService.getChildProgress(req.user!.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await parentService.getMessages(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export const parentController = { getChildren, getChildSummary, getChildProgress, getMessages };
