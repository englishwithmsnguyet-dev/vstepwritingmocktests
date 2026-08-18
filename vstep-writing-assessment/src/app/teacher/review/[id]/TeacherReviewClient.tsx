// src/app/teacher/review/[id]/TeacherReviewClient.tsx
"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { renderTaggedEssay } from "@/components/ErrorHighlight";
import { ArrowLeft, Save, Sparkles, AlertCircle, FileText, CheckCircle2, GraduationCap, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TeacherReviewClientProps {
  submission: any;
}

export default function TeacherReviewClient({ submission }: TeacherReviewClientProps) {
  const router = useRouter();

  // Load existing values or fallback to AI scores
  const [scoreTF, setScoreTF] = useState(submission.teacherScoreTF ?? submission.aiScoreTF ?? 6.0);
  const [scoreOrg, setScoreOrg] = useState(submission.teacherScoreOrg ?? submission.aiScoreOrg ?? 6.0);
  const [scoreVoc, setScoreVoc] = useState(submission.teacherScoreVoc ?? submission.aiScoreVoc ?? 6.0);
  const [scoreGra, setScoreGra] = useState(submission.teacherScoreGra ?? submission.aiScoreGra ?? 6.0);
  
  // Calculate default overall average
  const [scoreOverall, setScoreOverall] = useState(
    submission.teacherScoreOverall ?? submission.aiScoreOverall ?? 6.0
  );
  
  const [comments, setComments] = useState(submission.teacherComments || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to auto-calculate overall VSTEP band (average of 4 criteria rounded to nearest 0.5)
  const handleScoreChange = (criteria: "TF" | "Org" | "Voc" | "Gra", val: number) => {
    let tf = scoreTF;
    let org = scoreOrg;
    let voc = scoreVoc;
    let gra = scoreGra;

    if (criteria === "TF") {
      setScoreTF(val);
      tf = val;
    } else if (criteria === "Org") {
      setScoreOrg(val);
      org = val;
    } else if (criteria === "Voc") {
      setScoreVoc(val);
      voc = val;
    } else if (criteria === "Gra") {
      setScoreGra(val);
      gra = val;
    }

    const average = (tf + org + voc + gra) / 4;
    const rounded = Math.round(average * 2) / 2; // round to nearest 0.5
    setScoreOverall(rounded);
  };

  const handleSaveReview = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/teacher/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          scoreOverall,
          scoreTF,
          scoreOrg,
          scoreVoc,
          scoreGra,
          comments,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Không thể phê duyệt bài viết.");
      } else {
        alert("Đã hoàn tất đánh giá và cập nhật điểm số bài viết thành công!");
        router.push("/teacher");
        router.refresh();
      }
    } catch (err) {
      setError("Đã xảy ra lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const scoreOptions = Array.from({ length: 21 }, (_, i) => i * 0.5); // [0.0, 0.5, 1.0, ..., 10.0]

  return (
    <div className="flex-grow flex flex-col bg-slate-50 min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <Link href="/teacher" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-650 transition-colors mb-2 block">
              <ArrowLeft className="w-4 h-4" /> Quay lại Bài Nộp Lớp Học
            </Link>
            <h1 className="text-xl font-extrabold text-slate-850">
              Đánh Giá & Duyệt Bài Viết: {submission.student?.name || "Học viên"}
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Dạng bài VSTEP: {submission.taskType === "TASK1" ? "Task 1 (Email)" : "Task 2 (Essay)"} | Độ dài: {submission.wordCount} từ
            </p>
          </div>

          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Teacher Panel</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Essay highlighting (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
              <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center rounded-t-2xl">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mã lỗi sửa tự động bằng AI</span>
                <span className="text-[10px] text-slate-400 font-bold italic">
                  Hover lên vùng gạch chân để xem gợi ý sửa chi tiết
                </span>
              </div>

              <div className="p-6 text-slate-800 text-sm leading-relaxed whitespace-pre-line text-justify min-h-[400px]">
                {submission.aiFeedbackRaw ? (
                  renderTaggedEssay(submission.aiFeedbackRaw)
                ) : (
                  submission.essayText
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Teacher override form and comments */}
          <div className="space-y-6">
            
            {/* Score override card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
              <h3 className="font-extrabold text-slate-850 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                Chỉnh sửa Điểm Số VSTEP
              </h3>

              {/* Individual criteria grids */}
              <div className="space-y-4">
                {/* Score overall */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block">Tổng thể (Overall)</label>
                    <span className="text-[10px] text-slate-400 font-bold italic">Auto-calculated</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-600 pr-2">{scoreOverall.toFixed(1)}</div>
                </div>

                {/* Score TF */}
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-650 block">Task Fulfillment (TF)</label>
                  <select
                    value={scoreTF}
                    onChange={(e) => handleScoreChange("TF", parseFloat(e.target.value))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {scoreOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Org */}
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-650 block">Organization (Org)</label>
                  <select
                    value={scoreOrg}
                    onChange={(e) => handleScoreChange("Org", parseFloat(e.target.value))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {scoreOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Voc */}
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-650 block">Vocabulary (Voc)</label>
                  <select
                    value={scoreVoc}
                    onChange={(e) => handleScoreChange("Voc", parseFloat(e.target.value))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {scoreOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Gra */}
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-650 block">Grammar (Gra)</label>
                  <select
                    value={scoreGra}
                    onChange={(e) => handleScoreChange("Gra", parseFloat(e.target.value))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {scoreOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Teacher commentary card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-850 text-base">Nhận Xét Lớp Học</h3>
              
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full min-h-[140px] p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-700 text-xs leading-relaxed resize-y"
                placeholder="Nhập lời phê bình nhận xét chi tiết, chỉnh sửa cụm từ sai lỗi viết tay..."
              />

              <button
                onClick={handleSaveReview}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "Đang duyệt..." : "Phê Duyệt & Gửi Kết Quả"}
              </button>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
