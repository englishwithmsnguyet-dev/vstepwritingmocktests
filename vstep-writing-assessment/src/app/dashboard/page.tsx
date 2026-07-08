// src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { Plus, Eye, FileText, CheckCircle2, Clock, HelpCircle, GraduationCap } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Protect student dashboard route
  if (userRole === "TEACHER") {
    redirect("/teacher");
  }

  // Fetch student submissions
  const submissions = await prisma.submission.findMany({
    where: { studentId: userId },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate stats locally to prevent extra API calls on page render
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
    })
    .reverse(); // oldest first for chronological lines

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg shadow-slate-950/20">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Chào mừng, {session.user?.name || "Học viên"}!
            </h2>
            <p className="text-slate-400 text-sm mt-1">Luyện viết hàng ngày để cải thiện nhanh chóng kỹ năng VSTEP Writing.</p>
          </div>
          
          <Link
            href="/dashboard/submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-all shadow-md shadow-indigo-600/30 text-sm"
          >
            <Plus className="w-5 h-5" />
            Luyện Viết Bài Mới
          </Link>
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts panel - spans 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <AnalyticsCharts data={analyticsData} />
          </div>

          {/* Submissions Sidebar - spans 1 column */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 self-start">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-800 text-base">Lịch Sử Làm Bài</h3>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {submissions.length} Bài
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-medium">Bạn chưa thực hiện bài nộp nào.</p>
                <Link
                  href="/dashboard/submit"
                  className="text-xs font-bold text-indigo-600 hover:underline inline-block"
                >
                  Viết bài luận đầu tiên ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {submissions.map((sub) => {
                  const score = sub.teacherScoreOverall ?? sub.aiScoreOverall;
                  const isReviewed = sub.status === "REVIEWED";
                  const isDraft = sub.status === "DRAFT";

                  return (
                    <div
                      key={sub.id}
                      className="group border border-slate-150 p-4 rounded-xl hover:border-indigo-500/30 hover:bg-slate-50/50 transition-all duration-150 relative flex justify-between items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            sub.taskType === "TASK1"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-violet-50 text-violet-600 border-violet-100"
                          }`}>
                            {sub.taskType === "TASK1" ? "Task 1" : "Task 2"}
                          </span>

                          {isDraft ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              Bản Nháp
                            </span>
                          ) : isReviewed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              Giáo Viên Đã Sửa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              Đã Chấm AI
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 font-semibold">
                          Cập nhật: {new Date(sub.updatedAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      {/* Score Badge and View Action */}
                      <div className="flex items-center gap-3">
                        {score !== null && (
                          <div className="text-center bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                            <span className="text-[9px] text-indigo-500 font-bold uppercase block leading-none">Score</span>
                            <span className="text-sm font-extrabold text-indigo-750 leading-none block mt-0.5">
                              {score.toFixed(1)}
                            </span>
                          </div>
                        )}
                        
                        <Link
                          href={isDraft ? `/dashboard/submit?id=${sub.id}` : `/dashboard/report/${sub.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors bg-white shadow-sm"
                          title={isDraft ? "Sửa bản nháp" : "Xem báo cáo chi tiết"}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
