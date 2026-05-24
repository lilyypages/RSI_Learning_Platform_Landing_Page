import express from "express";
import cors from "cors";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import quizRoutes from "./routes/quiz.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
