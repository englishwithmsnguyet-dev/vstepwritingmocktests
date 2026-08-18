// src/app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let submissions;
    if (userRole === "TEACHER") {
      // Teacher views overall dashboard metrics
      submissions = await prisma.submission.findMany({
        where: {
          status: { in: ["PENDING_REVIEW", "REVIEWED"] },
        },
        orderBy: { createdAt: "asc" },
      });
    } else {
      // Student views their own metrics
      submissions = await prisma.submission.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: "asc" },
      });
    }

    // Process average scores over time
    const scoreHistory = submissions.map((sub) => {
      // Use teacher score as source of truth if available, otherwise fallback to AI
      const score = sub.teacherScoreOverall ?? sub.aiScoreOverall ?? 0;
      return {
        id: sub.id,
        taskType: sub.taskType,
        score,
        date: new Date(sub.createdAt).toLocaleDateString("vi-VN", {
          month: "short",
          day: "numeric",
        }),
      };
    });

    // Extract common grammar & vocabulary errors from JSON feedback
    const grammarErrorCounts: Record<string, number> = {};
    const vocabErrorCounts: Record<string, number> = {};

    submissions.forEach((sub) => {
      const feedback = sub.aiFeedbackJson as any;
      if (feedback) {
        if (Array.isArray(feedback.topGrammarErrors)) {
          feedback.topGrammarErrors.forEach((err: string) => {
            grammarErrorCounts[err] = (grammarErrorCounts[err] || 0) + 1;
          });
        }
        if (Array.isArray(feedback.topVocabularyErrors)) {
          feedback.topVocabularyErrors.forEach((err: string) => {
            vocabErrorCounts[err] = (vocabErrorCounts[err] || 0) + 1;
          });
        }
      }
    });

    // Format top errors as arrays
    const commonGrammar = Object.entries(grammarErrorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const commonVocab = Object.entries(vocabErrorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate generic stats
    const totalSubmissions = submissions.length;
    const gradedCount = submissions.filter((s) => s.status === "REVIEWED" || s.aiScoreOverall !== null).length;
    
    let sumScore = 0;
    submissions.forEach((s) => {
      sumScore += s.teacherScoreOverall ?? s.aiScoreOverall ?? 0;
    });
    const avgScore = gradedCount > 0 ? Math.round((sumScore / gradedCount) * 10) / 10 : 0;

    return NextResponse.json({
      scoreHistory,
      commonGrammar,
      commonVocab,
      stats: {
        total: totalSubmissions,
        graded: gradedCount,
        average: avgScore,
      },
    });
  } catch (error: any) {
    console.error("Fetch analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
