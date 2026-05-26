import prisma from "../config/prisma";

async function getChildren(parentUserId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    include: {
      students: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          class: true,
          _count: { select: { quizSessions: true } },
        },
      },
    },
  });
  if (!parent) throw new Error("Data orang tua tidak ditemukan.");

  return parent.students.map((s) => ({
    userId: s.userId,
    name: s.user.name,
    className: s.class?.name || "-",
    nis: s.nis,
    totalPoints: s.totalPoints,
    quizCount: s._count.quizSessions,
  }));
}

async function getChildSummary(parentUserId: string, childUserId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId: parentUserId } });
  if (!parent) throw new Error("Data orang tua tidak ditemukan.");

  const student = await prisma.student.findUnique({
    where: { userId: childUserId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: true,
      progress: {
        include: { classSubject: { include: { subject: true } } },
      },
    },
  });
  if (!student) throw new Error("Siswa tidak ditemukan.");
  if (student.parentId !== parent.id) throw new Error("Bukan anak anda.");

  const perSubject = student.progress.map((p) => ({
    subjectName: p.classSubject.subject.name,
    totalScore: p.totalScore,
    completionPercent: p.completionPercent,
    adaptiveLevel: p.adaptiveLevel,
    lastActivity: p.lastActivity,
  }));

  return {
    name: student.user.name,
    className: student.class?.name || "-",
    nis: student.nis,
    totalPoints: student.totalPoints,
    perSubject,
  };
}

async function getChildProgress(parentUserId: string, childUserId: string) {
  const parent = await prisma.parent.findUnique({ where: { userId: parentUserId } });
  if (!parent) throw new Error("Data orang tua tidak ditemukan.");

  const student = await prisma.student.findUnique({ where: { userId: childUserId } });
  if (!student) throw new Error("Siswa tidak ditemukan.");
  if (student.parentId !== parent.id) throw new Error("Bukan anak anda.");

  const reports = await prisma.weeklyReport.findMany({
    where: { studentId: student.id },
    include: { classSubject: { include: { subject: true } } },
    orderBy: { weekStart: "desc" },
    take: 12,
  });

  return reports.map((r) => ({
    weekStart: r.weekStart,
    subjectName: r.classSubject.subject.name,
    avgScore: r.avgScore,
    completionRate: r.completionRate,
    kkmAchieved: r.kkmAchieved,
    recommendation: r.recommendation,
  }));
}

async function getMessages(parentUserId: string) {
  return prisma.message.findMany({
    where: { receiverId: parentUserId },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
    orderBy: { sentAt: "desc" },
  });
}

export const parentService = { getChildren, getChildSummary, getChildProgress, getMessages };
