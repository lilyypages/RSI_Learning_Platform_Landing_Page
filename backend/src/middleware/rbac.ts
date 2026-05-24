import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Akses ditolak." });
      return;
    }

    next();
  };
}

export { authorize };
