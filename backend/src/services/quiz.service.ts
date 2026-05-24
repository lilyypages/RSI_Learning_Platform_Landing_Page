import prisma from "../config/prisma";
import { setQuizState, getQuizState, delQuizState } from "../config/redis";

const DIFFICULTY_ORDER = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
type Difficulty = typeof DIFFICULTY_ORDER[number];
const STREAK_THRESHOLD = 2;
const LIVES_DEFAULT = 3;
const QUESTIONS_PER_SESSION = 10;

function nextDifficulty(current: string, correctStreak: number, wrongStreak: number): string {
  const idx = DIFFICULTY_ORDER.indexOf(current as Difficulty);
  if (idx === -1) return "MEDIUM";

  if (correctStreak >= STREAK_THRESHOLD && idx < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[idx + 1];
  }
  if (wrongStreak >= STREAK_THRESHOLD && idx > 0) {
    return DIFFICULTY_ORDER[idx - 1];
  }
  return current;
}

function pointsForDifficulty(difficulty: string): number {
  switch (difficulty) {
    case "EASY": return 10;
    case "MEDIUM": return 20;
    case "HARD": return 30;
    case "EXPERT": return 50;
    default: return 10;
  }
}

function calculateResultLevel(correct: number, total: number): string {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio >= 0.8) return "EXCELLENT";
  if (ratio >= 0.5) return "PASSED";
  return "FAILED";
}

function calculateAdaptiveLevel(correct: number, total: number, finalDifficulty: string): string {
  const ratio = total > 0 ? correct / total : 0;
  const diffIdx = DIFFICULTY_ORDER.indexOf(finalDifficulty as Difficulty);
  if (ratio >= 0.7 && diffIdx >= 2) return "ADVANCED";
  if (ratio < 0.5) return "REMEDIAL";
  return "STANDARD";
}

async function startQuiz(studentId: string, materialId: string, classSubjectId: string) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!material) throw new Error("Materi tidak ditemukan.");
  if (material.questions.length === 0) throw new Error("Tidak ada soal pada materi ini.");

  const student = await prisma.student.findUnique({ where: { userId: studentId } });
  if (!student) throw new Error("Data siswa tidak ditemukan.");

  const lives = student.livesRemaining;

  // Check for existing active session
  const existing = await prisma.quizSession.findFirst({
    where: { studentId: student.id, materialId, finishedAt: null },
  });
  if (existing) {
    throw new Error("Masih ada sesi kuis yang aktif.");
  }

  const session = await prisma.quizSession.create({
    data: {
      studentId: student.id,
      classSubjectId,
      materialId,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      livesUsed: 0,
      streakCount: 0,
      currentLevel: "MEDIUM",
      startedAt: new Date(),
    },
  });

  // Pick first question (MEDIUM)
  const firstQuestion = material.questions.find(q => q.difficulty === "MEDIUM") || material.questions[0];

  // Save state to Redis
  await setQuizState(session.id, {
    sessionId: session.id,
    currentDifficulty: "MEDIUM",
    correctStreak: 0,
    wrongStreak: 0,
    questionsAnswered: 0,
    livesRemaining: lives,
  });

  // Shuffle options for client
  const question = {
    id: firstQuestion.id,
    questionText: firstQuestion.questionText,
    options: firstQuestion.options,
    difficulty: firstQuestion.difficulty,
    pointReward: firstQuestion.pointReward,
    orderIndex: firstQuestion.orderIndex,
    totalQuestions: material.questions.length,
    questionsAnswered: 0,
    livesRemaining: lives,
  };

  return { sessionId: session.id, question };
}

async function answerQuiz(
  studentId: string,
  sessionId: string,
  questionId: string,
  answer: string,
  timeTakenSec?: number,
) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      material: { include: { questions: { orderBy: { orderIndex: "asc" } } } },
      answers: true,
    },
  });
  if (!session) throw new Error("Sesi kuis tidak ditemukan.");
  if (session.finishedAt) throw new Error("Sesi kuis sudah selesai.");

  const student = await prisma.student.findUnique({ where: { userId: studentId } });
  if (!student) throw new Error("Data siswa tidak ditemukan.");

  if (session.studentId !== student.id) throw new Error("Bukan sesi kuis kamu.");

  // Check if already answered
  const alreadyAnswered = session.answers.find(a => a.questionId === questionId);
  if (alreadyAnswered) throw new Error("Soal ini sudah dijawab.");

  const question = session.material.questions.find(q => q.id === questionId);
  if (!question) throw new Error("Soal tidak ditemukan.");

  const isCorrect = answer.trim().toLowerCase() === (question.correctAnswer as string).trim().toLowerCase();
  const optionsArr = question.options as string[];

  // Get state from Redis or compute from DB
  let state = await getQuizState(sessionId);
  if (!state) {
    state = {
      sessionId,
      currentDifficulty: session.currentLevel,
      correctStreak: session.streakCount >= 0 ? 0 : 0,
      wrongStreak: 0,
      questionsAnswered: session.answers.length,
      livesRemaining: student.livesRemaining,
    };
  }

  // Update state
  let newCorrectStreak = isCorrect ? state.correctStreak + 1 : 0;
  let newWrongStreak = isCorrect ? 0 : state.wrongStreak + 1;
  let newLives = state.livesRemaining;
  let livesUsedThisSession = session.livesUsed;

  if (!isCorrect) {
    newLives -= 1;
    livesUsedThisSession += 1;
  }

  const newDifficulty = nextDifficulty(state.currentDifficulty, newCorrectStreak, newWrongStreak);
  const newQuestionsAnswered = state.questionsAnswered + 1;
  const newStreakCount = isCorrect ? session.streakCount + 1 : 0;
  const newScore = session.score + (isCorrect ? pointsForDifficulty(state.currentDifficulty) : 0);
  const newCorrectCount = session.correctCount + (isCorrect ? 1 : 0);
  const newWrongCount = session.wrongCount + (isCorrect ? 0 : 1);

  // Save answer
  await prisma.quizAnswer.create({
    data: {
      sessionId,
      questionId,
      answerGiven: answer,
      isCorrect,
      timeTakenSec,
    },
  });

  // Check if session should end
  const shouldEnd = newQuestionsAnswered >= QUESTIONS_PER_SESSION || newLives <= 0 || newQuestionsAnswered >= session.material.questions.length;

  if (shouldEnd) {
    const resultLevel = calculateResultLevel(newCorrectCount, newQuestionsAnswered);
    const adaptiveLevel = calculateAdaptiveLevel(newCorrectCount, newQuestionsAnswered, newDifficulty);
    const points = isCorrect ? pointsForDifficulty(state.currentDifficulty) : 0;

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        score: newScore,
        correctCount: newCorrectCount,
        wrongCount: newWrongCount,
        livesUsed: livesUsedThisSession,
        streakCount: newStreakCount,
        currentLevel: newDifficulty,
        resultLevel,
        finishedAt: new Date(),
      },
    });

    // Update student lives
    await prisma.student.update({
      where: { id: student.id },
      data: { livesRemaining: Math.max(0, newLives) },
    });

    // Update progress
    await prisma.studentProgress.upsert({
      where: {
        studentId_classSubjectId: {
          studentId: student.id,
          classSubjectId: session.classSubjectId,
        },
      },
      create: {
        studentId: student.id,
        classSubjectId: session.classSubjectId,
        completionPercent: 100,
        totalScore: newScore,
        adaptiveLevel,
        lastActivity: new Date(),
      },
      update: {
        completionPercent: { increment: newQuestionsAnswered >= QUESTIONS_PER_SESSION ? 10 : 0 },
        totalScore: { increment: newScore },
        adaptiveLevel,
        lastActivity: new Date(),
      },
    });

    // Points log
    if (points > 0) {
      await prisma.pointLog.create({
        data: {
          studentId: student.id,
          pointsEarned: points,
          sourceType: "QUIZ",
          sourceId: sessionId,
          description: `Quiz ${resultLevel === "EXCELLENT" ? "sempurna" : "selesai"}`,
        },
      });
    }

    await delQuizState(sessionId);

    return {
      status: "finished",
      result: {
        sessionId,
        score: newScore,
        correctCount: newCorrectCount,
        wrongCount: newWrongCount,
        livesUsed: livesUsedThisSession,
        streakCount: newStreakCount,
        resultLevel,
        adaptiveLevel,
        totalQuestions: newQuestionsAnswered,
      },
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: null,
    };
  }

  // Update session
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      score: newScore,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
      livesUsed: livesUsedThisSession,
      streakCount: newStreakCount,
      currentLevel: newDifficulty,
    },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { livesRemaining: Math.max(0, newLives) },
  });

  // Save updated state to Redis
  await setQuizState(sessionId, {
    sessionId,
    currentDifficulty: newDifficulty,
    correctStreak: newCorrectStreak,
    wrongStreak: newWrongStreak,
    questionsAnswered: newQuestionsAnswered,
    livesRemaining: newLives,
  });

  // Pick next question at the determined difficulty
  const answeredIds = new Set([...session.answers.map(a => a.questionId), questionId]);
  let nextQuestion = session.material.questions.find(
    q => q.difficulty === newDifficulty && !answeredIds.has(q.id)
  );
  // Fallback: any difficulty
  if (!nextQuestion) {
    nextQuestion = session.material.questions.find(q => !answeredIds.has(q.id));
  }

  if (!nextQuestion) {
    // No more questions — finish
    return await answerQuiz(studentId, sessionId, questionId, answer, timeTakenSec);
  }

  return {
    status: "next",
    question: {
      id: nextQuestion.id,
      questionText: nextQuestion.questionText,
      options: nextQuestion.options,
      difficulty: nextQuestion.difficulty,
      pointReward: nextQuestion.pointReward,
      orderIndex: nextQuestion.orderIndex,
    },
    isCorrect,
    correctAnswer: question.correctAnswer,
    currentDifficulty: newDifficulty,
    correctStreak: newCorrectStreak,
    livesRemaining: Math.max(0, newLives),
    questionsAnswered: newQuestionsAnswered,
    totalQuestions: QUESTIONS_PER_SESSION,
    streak: newStreakCount,
  };
}

async function getSessionDetail(sessionId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: { question: true },
        orderBy: { id: "asc" },
      },
      material: { select: { id: true, title: true } },
    },
  });
  if (!session) throw new Error("Sesi kuis tidak ditemukan.");

  return {
    id: session.id,
    materialTitle: session.material.title,
    score: session.score,
    correctCount: session.correctCount,
    wrongCount: session.wrongCount,
    livesUsed: session.livesUsed,
    streakCount: session.streakCount,
    resultLevel: session.resultLevel,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    answers: session.answers.map(a => ({
      questionText: a.question.questionText,
      answerGiven: a.answerGiven,
      correctAnswer: a.question.correctAnswer,
      isCorrect: a.isCorrect,
      timeTakenSec: a.timeTakenSec,
    })),
  };
}

export const quizService = { startQuiz, answerQuiz, getSessionDetail };
