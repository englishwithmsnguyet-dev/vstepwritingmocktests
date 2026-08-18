// src/app/teacher/analytics/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { BarChart2, Users } from "lucide-react";

export default async function TeacherAnalytics() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userRole = (session.user as any).role;

  // Protect route
  if (userRole !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch all non-draft class submissions
  const submissions = await prisma.submission.findMany({
    where: {
      status: { in: ["PENDING_REVIEW", "REVIEWED"] },
    },
    orderBy: { createdAt: "asc" },
  });

  // Format score history
  const scoreHistory = submissions
    .filter((sub) => sub.aiScoreOverall !== null || sub.teacherScoreOverall !== null)
    .map((sub) => {
      const score = sub.teacherScoreOverall ?? sub.aiScoreOverall ?? 0;
      return {
        id: sub.id,
        taskType: sub.taskType,
        score,
        date: new Date(sub.createdAt).toLocaleDateString("vi-VN", {
          month: "numeric",
          day: "numeric",
        }),
      };
    });

  // Extract common grammar & vocabulary errors across the class
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

  const commonGrammar = Object.entries(grammarErrorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const commonVocab = Object.entries(vocabErrorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const total = submissions.length;
  const graded = submissions.filter((s) => s.status === "REVIEWED" || s.aiScoreOverall !== null).length;
  
  let sumScore = 0;
  let gradedCount = 0;
  submissions.forEach((s) => {
    const score = s.teacherScoreOverall ?? s.aiScoreOverall;
    if (score !== null && score !== undefined) {
      sumScore += score;
      gradedCount++;
    }
  });
  const average = gradedCount > 0 ? sumScore / gradedCount : 0;

  const analyticsData = {
    scoreHistory,
    commonGrammar,
    commonVocab,
    stats: {
      total,
      graded,
      average,
    },
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-50 min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-400" />
              Thống Kê Tiến Trình Lớp Học
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Phân tích điểm trung bình của cả lớp, phân phối điểm số và các lỗi viết sai phổ biến nhất của học viên.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-350">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Chế độ: Báo Cáo Giáo Viên</span>
          </div>
        </div>

        {/* Analytics Graphs Component */}
        <AnalyticsCharts data={analyticsData} />
      </main>
    </div>
  );
}
