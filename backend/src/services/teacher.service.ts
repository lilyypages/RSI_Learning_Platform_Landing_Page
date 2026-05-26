import prisma from "../config/prisma";

function scoreToStatus(avg: number): string {
  if (avg >= 85) return "SANGAT_BAIK";
  if (avg >= 75) return "BAIK";
  if (avg >= 70) return "CUKUP";
  return "BUTUH_PERHATIAN";
}

async function getStudents(teacherUserId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId } });
  if (!teacher) throw new Error("Data guru tidak ditemukan.");

  const classSubjects = await prisma.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: true,
      subject: true,
      progress: {
        include: {
          student: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  const studentMap = new Map<string, {
    studentId: string;
    studentName: string;
    className: string;
    scores: number[];
    subjects: string[];
  }>();

  for (const cs of classSubjects) {
    for (const p of cs.progress) {
      const key = p.studentId;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: p.student.userId,
          studentName: p.student.user.name,
          className: cs.class.name,
          scores: [],
          subjects: [],
        });
      }
      const entry = studentMap.get(key)!;
      entry.scores.push(p.totalScore);
      if (!entry.subjects.includes(cs.subject.name)) {
        entry.subjects.push(cs.subject.name);
      }
    }
  }

  return Array.from(studentMap.values()).map((s) => {
    const avg = s.scores.length > 0
      ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
      : 0;
    return {
      userId: s.studentId,
      name: s.studentName,
      className: s.className,
      averageScore: avg,
      status: scoreToStatus(avg),
      subjectCount: s.subjects.length,
    };
  });
}

async function getStudentDetail(studentUserId: string) {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: true,
      progress: {
        include: { classSubject: { include: { subject: true } } },
      },
      quizSessions: {
        take: 10,
        orderBy: { startedAt: "desc" },
        include: { material: { select: { title: true } } },
      },
    },
  });
  if (!student) throw new Error("Siswa tidak ditemukan.");

  const perSubject = student.progress.map((p) => ({
    subjectName: p.classSubject.subject.name,
    totalScore: p.totalScore,
    completionPercent: p.completionPercent,
    adaptiveLevel: p.adaptiveLevel,
    lastActivity: p.lastActivity,
  }));

  const recentQuizzes = student.quizSessions.map((q) => ({
    materialTitle: q.material.title,
    score: q.score,
    correctCount: q.correctCount,
    wrongCount: q.wrongCount,
    resultLevel: q.resultLevel,
    startedAt: q.startedAt,
  }));

  return {
    name: student.user.name,
    email: student.user.email,
    className: student.class?.name || "-",
    nis: student.nis,
    totalPoints: student.totalPoints,
    perSubject,
    recentQuizzes,
  };
}

async function createSubject(data: { name: string; code: string }) {
  const existing = await prisma.subject.findUnique({ where: { code: data.code } });
  if (existing) throw new Error("Kode mapel sudah ada.");

  return prisma.subject.create({ data });
}

async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

async function createClassSubject(teacherUserId: string, data: {
  classId: string;
  subjectId: string;
  semester: number;
  academicYear: number;
}) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId } });
  if (!teacher) throw new Error("Data guru tidak ditemukan.");

  return prisma.classSubject.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: teacher.id,
      semester: data.semester,
      academicYear: data.academicYear,
    },
    include: {
      class: true,
      subject: true,
    },
  });
}

async function getClassSubjects(teacherUserId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId } });
  if (!teacher) throw new Error("Data guru tidak ditemukan.");

  return prisma.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: { class: true, subject: true },
    orderBy: { class: { name: "asc" } },
  });
}

async function getMaterials(classSubjectId?: string) {
  const where = classSubjectId ? { classSubjectId } : {};
  return prisma.material.findMany({
    where,
    include: { classSubject: { include: { subject: true, class: true } }, _count: { select: { questions: true } } },
    orderBy: { orderIndex: "asc" },
  });
}

async function createMaterial(data: {
  classSubjectId: string;
  title: string;
  contentText?: string;
  orderIndex: number;
  difficulty?: string;
}) {
  return prisma.material.create({
    data: {
      classSubjectId: data.classSubjectId,
      title: data.title,
      contentText: data.contentText,
      orderIndex: data.orderIndex,
      difficulty: data.difficulty || "MEDIUM",
    },
  });
}

async function updateMaterial(id: string, data: {
  title?: string;
  contentText?: string;
  orderIndex?: number;
  difficulty?: string;
  isPublished?: boolean;
}) {
  return prisma.material.update({ where: { id }, data });
}

async function deleteMaterial(id: string) {
  await prisma.material.delete({ where: { id } });
}

async function getQuestions(materialId?: string) {
  const where = materialId ? { materialId } : {};
  return prisma.question.findMany({
    where,
    include: { material: { select: { title: true } } },
    orderBy: { orderIndex: "asc" },
  });
}

async function createQuestion(data: {
  materialId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty?: string;
  pointReward?: number;
  orderIndex: number;
}) {
  return prisma.question.create({
    data: {
      materialId: data.materialId,
      questionText: data.questionText,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty || "MEDIUM",
      pointReward: data.pointReward || 0,
      orderIndex: data.orderIndex,
    },
  });
}

async function updateQuestion(id: string, data: {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  difficulty?: string;
  pointReward?: number;
  orderIndex?: number;
}) {
  return prisma.question.update({ where: { id }, data });
}

async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } });
}

async function getParents() {
  return prisma.parent.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

async function getClasses() {
  return prisma.class.findMany({
    orderBy: { name: "asc" },
  });
}

export const teacherService = {
  getStudents, getStudentDetail,
  createSubject, getSubjects,
  createClassSubject, getClassSubjects,
  getParents, getClasses,
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
};
