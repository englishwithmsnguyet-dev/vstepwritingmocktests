// src/app/teacher/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FileEdit, ClipboardList, CheckCircle2, Clock, Eye, Users, AlertCircle } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userRole = (session.user as any).role;

  // Protect teacher dashboard route
  if (userRole !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch all non-draft student submissions
  const submissions = await prisma.submission.findMany({
    where: {
      status: { in: ["PENDING_REVIEW", "REVIEWED"] },
    },
    include: {
      student: {
        select: { name: true, email: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex-grow flex flex-col bg-slate-50 min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Bảng Điều Khiển Giáo Viên
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Phê duyệt kết quả chấm điểm của AI, chỉnh sửa điểm số VSTEP, và viết nhận xét chi tiết cho học viên.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-350">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Chế độ: Giảng Dạy</span>
          </div>
        </div>

        {/* Submissions List Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              Danh Sách Bài Viết Đang Chờ Duyệt / Đã Sửa
            </h3>
            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {submissions.length} Bài nộp
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3">
              <ClipboardList className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
              <p className="text-sm font-semibold">Chưa có bài viết học viên nào cần chấm.</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Khi học viên hoàn thành bài tập nộp cho AI, các bài viết sẽ tự động xuất hiện ở đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Học viên</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Dạng Bài</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Số Từ</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm VSTEP</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày nộp</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-150 text-slate-700 text-sm">
                  {submissions.map((sub) => {
                    const finalScore = sub.teacherScoreOverall ?? sub.aiScoreOverall ?? 0;
                    const isReviewed = sub.status === "REVIEWED";

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{sub.student?.name || "Học viên"}</div>
                          <div className="text-xs text-slate-400">{sub.student?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            sub.taskType === "TASK1"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-violet-50 text-violet-600 border-violet-100"
                          }`}>
                            {sub.taskType === "TASK1" ? "Task 1" : "Task 2"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-650 font-semibold">{sub.wordCount} từ</td>
                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-800">
                          {finalScore > 0 ? (
                            <span className="flex items-center gap-1">
                              {finalScore.toFixed(1)}
                              {sub.teacherScoreOverall !== null && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                                  GV sửa
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-450 italic text-xs">Chờ chấm AI</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isReviewed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã Sửa Lỗi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              Chờ GV Xem
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-semibold">
                          {new Date(sub.updatedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            href={`/teacher/review/${sub.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-650 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors font-bold text-xs shadow-sm bg-white"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            {isReviewed ? "Xem lại & Sửa" : "Chấm điểm / Duyệt"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
