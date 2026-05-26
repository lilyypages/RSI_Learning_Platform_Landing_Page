import express from "express";
import cors from "cors";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import quizRoutes from "./routes/quiz.routes";
import teacherRoutes from "./routes/teacher.routes";
import parentRoutes from "./routes/parent.routes";
import { authenticate } from "./middleware/auth";
import { authorize } from "./middleware/rbac";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/quiz", authenticate, authorize("STUDENT"), quizRoutes);
app.use("/teacher", authenticate, authorize("TEACHER", "PRINCIPAL"), teacherRoutes);
app.use("/parent", authenticate, authorize("PARENT", "PRINCIPAL"), parentRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
