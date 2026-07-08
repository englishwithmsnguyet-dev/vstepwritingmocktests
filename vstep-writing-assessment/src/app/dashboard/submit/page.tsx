// src/app/dashboard/submit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Save, Sparkles, AlertCircle, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

const DEFAULT_PROMPTS = {
  TASK1:
    "You received an email from your English friend, John, who wants to know about your plans for the upcoming summer vacation. Write an email to John. In your email, you should:\n- Tell him where you plan to go\n- Explain who you are going with\n- Suggest that he join you for a part of the holiday.\nWrite at least 120 words. You do not need to write any addresses.",
  TASK2:
    "Some people believe that studying online is more convenient and effective than traditional classroom learning. Others argue that physical classrooms are necessary for social development. Discuss both views and give your opinion. Write an essay of at least 250 words.",
};

export default function SubmitEssay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id"); // checks if editing an existing draft

  const [taskType, setTaskType] = useState<"TASK1" | "TASK2">("TASK2");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPTS.TASK2);
  const [essayText, setEssayText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(editId);
  const [error, setError] = useState<string | null>(null);

  // Live word counter
  useEffect(() => {
    const words = essayText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [essayText]);

  // Handle task type toggle
  const handleTaskTypeChange = (type: "TASK1" | "TASK2") => {
    setTaskType(type);
    setPrompt(DEFAULT_PROMPTS[type]);
  };

  // Load existing draft if present
  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/submissions/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setTaskType(data.taskType);
            setPrompt(data.prompt);
            setEssayText(data.essayText);
            setSubmissionId(data.id);
          } else {
            setError("Không tìm thấy bản nháp hoặc bạn không có quyền truy cập.");
          }
        })
        .catch(() => setError("Lỗi khi tải bản nháp."))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  // Save draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submissionId,
          taskType,
          prompt,
          essayText,
          wordCount,
          status: "DRAFT",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Không thể lưu bản nháp.");
      } else {
        setSubmissionId(data.id);
        alert("Đã lưu bản nháp thành công!");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  // Submit and trigger AI evaluation
  const handleSubmitAndAnalyze = async () => {
    if (essayText.trim().length === 0) {
      setError("Bài viết của bạn đang trống.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Save or update the submission first (set status to PENDING_REVIEW)
      const saveResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submissionId,
          taskType,
          prompt,
          essayText,
          wordCount,
          status: "PENDING_REVIEW",
        }),
      });

      const savedData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(savedData.error || "Không thể nộp bài viết.");
      }

      const currentSubId = savedData.id;

      // 2. Trigger AI Evaluation API
      const evalResponse = await fetch(`/api/submissions/${currentSubId}/evaluate`, {
        method: "POST",
      });

      const evalData = await evalResponse.json();

      if (!evalResponse.ok) {
        throw new Error(evalData.error || "Không thể hoàn thành chấm điểm tự động.");
      }

      // 3. Redirect to the detailed report page
      router.push(`/dashboard/report/${currentSubId}`);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng nộp lại.");
      setLoading(false);
    }
  };

  const wordLimit = taskType === "TASK1" ? 120 : 250;
  const isWordCountMet = wordCount >= wordLimit;

  return (
    <div className="flex-grow flex flex-col bg-slate-50 min-h-screen">
      <Navbar />

      {/* Loading overlay for AI evaluation */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin mb-6" />
          <h3 className="text-xl font-bold mb-2 animate-pulse">Hệ thống AI đang chấm bài...</h3>
          <p className="text-slate-400 text-sm max-w-sm text-center leading-relaxed">
            Hệ thống đang phân tích ngữ pháp, từ vựng, tính mạch lạc và chấm điểm bài viết theo chuẩn VSTEP. Quá trình này mất khoảng 5-15 giây.
          </p>
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Back Button */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại Bảng Điều Khiển
          </Link>
          <span className="text-sm text-slate-400 font-semibold">Workspace</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor panel - spans 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Task Type Switch */}
            <div className="bg-white border border-slate-200 p-2 rounded-2xl flex gap-2 w-max shadow-sm">
              <button
                onClick={() => handleTaskTypeChange("TASK1")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  taskType === "TASK1" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-550 hover:bg-slate-50"
                }`}
              >
                VSTEP Writing Task 1
              </button>
              <button
                onClick={() => handleTaskTypeChange("TASK2")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  taskType === "TASK2" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-550 hover:bg-slate-50"
                }`}
              >
                VSTEP Writing Task 2
              </button>
            </div>

            {/* Prompt Display */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Yêu cầu Đề bài (Prompt)
              </h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[80px] p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-700 text-xs font-medium bg-slate-50/50 leading-relaxed resize-y"
                placeholder="Nhập đề bài tại đây..."
              />
            </div>

            {/* Essay Editor Area */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-[450px]">
              <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50/30 rounded-t-2xl">
                <span className="text-xs text-slate-550 font-bold">KHU VỰC VIẾT BÀI LUẬN</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    isWordCountMet
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {wordCount} từ {isWordCountMet ? " (Đạt yêu cầu)" : ` / tối thiểu ${wordLimit} từ`}
                </span>
              </div>

              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                className="flex-1 w-full p-6 text-slate-800 text-sm focus:outline-none leading-relaxed font-mono resize-none"
                placeholder="Nhập bài viết luận của bạn tại đây (Hệ thống sẽ đếm từ tự động)..."
              />
            </div>
          </div>

          {/* Guidelines & submission actions - spans 1 column */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="font-bold text-slate-800 text-sm pb-4 border-b border-slate-100">Hành Động</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || loading}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 font-bold text-slate-700 text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Đang lưu..." : "Lưu Bản Nháp"}
                </button>

                <button
                  onClick={handleSubmitAndAnalyze}
                  disabled={loading || saving}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Nộp Bài & Chấm Điểm AI
                </button>
              </div>
            </div>

            {/* Rubrics Guidelines helper card */}
            <div className="bg-indigo-950 text-indigo-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-white text-xs uppercase tracking-wide">Lưu ý VSTEP Writing</h4>
              <ul className="space-y-2 text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span><strong>Task 1:</strong> Dành 20 phút. Viết thư/email tối thiểu <strong>120 từ</strong>. Chú ý văn phong thân mật (email cho bạn bè) hay trang trọng (thư xin việc, khiếu nại).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span><strong>Task 2:</strong> Dành 40 phút. Viết luận tối thiểu <strong>250 từ</strong>. Cần có đủ 3 phần: Mở bài (dẫn dắt + quan điểm), Thân bài (chia 2 đoạn rõ ràng), Kết bài (tóm tắt ý).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span>Cố gắng sử dụng đa dạng các từ nối học thuật (Furthermore, On the other hand, In conclusion) để đạt điểm cao Coherence.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
