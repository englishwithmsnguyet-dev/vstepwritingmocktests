// src/app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { GraduationCap, PenTool, Sparkles, CheckCircle2 } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // Redirect if already authenticated
  if (session?.user) {
    const role = (session.user as any).role;
    if (role === "TEACHER") {
      redirect("/teacher");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex-1 flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
      {/* Left side: branding and hero features */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-20 lg:py-24 bg-black/20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Grading System
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Luyện Viết <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">VSTEP Writing</span> Hiệu Quả Với Trí Tuệ Nhân Tạo
          </h1>
          
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Hệ thống tự động chấm điểm chi tiết 4 tiêu chí VSTEP (0-10), khoanh vùng sửa lỗi ngữ pháp, từ vựng trực tiếp trên bài viết của bạn.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100">Gạch chân sửa lỗi tức thì</h4>
                <p className="text-slate-400 text-sm">Hiển thị lỗi sai chính tả, ngữ pháp, diễn đạt bằng mã màu trực quan kèm gợi ý sửa lỗi khi hover.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100">Chấm điểm 4 tiêu chí VSTEP</h4>
                <p className="text-slate-400 text-sm">Điểm số chi tiết cho Task Fulfillment, Coherence, Lexical Resource, và Grammatical Accuracy.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100">Hỗ trợ giáo viên chấm và nhận xét</h4>
                <p className="text-slate-400 text-sm">Giáo viên có thể theo dõi tiến độ cả lớp, sửa điểm, bổ sung nhận xét viết tay thủ công.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: login container */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Miss Nguyet Class</span>
              <h2 className="text-xl font-bold">VSTEP WRITING</h2>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
