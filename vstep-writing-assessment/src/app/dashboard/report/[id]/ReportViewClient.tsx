// src/app/dashboard/report/[id]/ReportViewClient.tsx
"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { renderTaggedEssay } from "@/components/ErrorHighlight";
import ReportPDF from "@/components/ReportPDF";
import { Award, FileText, ShieldAlert, Sparkles, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";
import Link from "next/link";

interface ReportViewClientProps {
  submission: any;
}

export default function ReportViewClient({ submission }: ReportViewClientProps) {
  const [activeTab, setActiveTab] = useState<"scores" | "feedback" | "teacher">("scores");

  const scoreOverall = submission.teacherScoreOverall ?? submission.aiScoreOverall ?? 0;
  const scoreTF = submission.teacherScoreTF ?? submission.aiScoreTF ?? 0;
  const scoreOrg = submission.teacherScoreOrg ?? submission.aiScoreOrg ?? 0;
  const scoreVoc = submission.teacherScoreVoc ?? submission.aiScoreVoc ?? 0;
  const scoreGra = submission.teacherScoreGra ?? submission.aiScoreGra ?? 0;

  const feedback = submission.aiFeedbackJson || {};
  const isReviewed = submission.status === "REVIEWED";

  // Calculate error counts from taggedEssay XML markup
  const countErrors = (type: string) => {
    const regex = new RegExp(`<error\\s+type="${type}"`, "g");
    return (submission.aiFeedbackRaw?.match(regex) || []).length;
  };

  const errGrammar = countErrors("grammar");
  const errVocab = countErrors("vocabulary");
  const errSpelling = countErrors("spelling");
  const errCohesion = countErrors("cohesion");
  const totalErrors = errGrammar + errVocab + errSpelling + errCohesion;

  // VSTEP level label generator
  const getVstepLevel = (score: number) => {
    if (score >= 8.5) return { label: "ĐẠT C1", color: "bg-indigo-600 text-white border-indigo-700" };
    if (score >= 6.0) return { label: "ĐẠT B2", color: "bg-sky-600 text-white border-sky-700" };
    if (score >= 4.0) return { label: "ĐẠT B1", color: "bg-emerald-600 text-white border-emerald-700" };
    return { label: "CHƯA ĐẠT B1", color: "bg-rose-600 text-white border-rose-700" };
  };

  const level = getVstepLevel(scoreOverall);

  return (
    <div className="flex-grow flex flex-col bg-slate-50 min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top bar with back and download */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-850 flex items-center gap-2">
              Báo Cáo Chi Tiết Bài Viết #{submission.id.substring(0, 8)}
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Bài nộp: {new Date(submission.createdAt).toLocaleDateString("vi-VN")} | Trạng thái:{" "}
              <strong className={isReviewed ? "text-emerald-600" : "text-indigo-600"}>
                {isReviewed ? "Giáo viên đã phê duyệt" : "Đã chấm điểm AI"}
              </strong>
            </p>
          </div>

          <ReportPDF submission={submission} />
        </div>

        {/* Detailed Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Essay and inline error highlight rendering (takes 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-max min-h-[500px]">
              {/* Box header */}
              <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bài viết học viên & Sửa lỗi chi tiết</span>
                <span className="text-xs text-slate-500 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {totalErrors} lỗi đã phát hiện
                </span>
              </div>

              {/* Essay Viewer */}
              <div className="p-6 text-slate-800 text-sm leading-relaxed whitespace-pre-line text-justify min-h-[400px]">
                {submission.aiFeedbackRaw ? (
                  renderTaggedEssay(submission.aiFeedbackRaw)
                ) : (
                  submission.essayText
                )}
              </div>

              {/* Error Legend */}
              <div className="border-t border-slate-100 p-4 bg-slate-50/30 flex flex-wrap gap-4 text-xs font-bold rounded-b-2xl">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-red-500 rounded"></span>
                  Ngữ Pháp ({errGrammar})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-orange-500 rounded"></span>
                  Từ Vựng ({errVocab})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-yellow-500 rounded"></span>
                  Chính Tả ({errSpelling})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-blue-500 rounded"></span>
                  Mạch Lạc ({errCohesion})
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: Evaluation details, scores, feedback (takes 1 col) */}
          <div className="space-y-6">
            
            {/* VSTEP score display card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
                <Award className="w-36 h-36" />
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest block">Dự báo trình độ</span>
                  <span className={`inline-block mt-2 text-xs font-black uppercase px-3 py-1 rounded border ${level.color}`}>
                    {level.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest block">VSTEP Score</span>
                  <span className="text-4xl font-black tracking-tighter block mt-1">{scoreOverall.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Assessment Tabs Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab("scores")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                    activeTab === "scores"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Điểm thành phần
                </button>
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                    activeTab === "feedback"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Nhận xét AI
                </button>
                {isReviewed && (
                  <button
                    onClick={() => setActiveTab("teacher")}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                      activeTab === "teacher"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Lời phê GV
                  </button>
                )}
              </div>

              <div className="p-6">
                {/* Score Breakdown Tab */}
                {activeTab === "scores" && (
                  <div className="space-y-4">
                    {/* Score Item 1 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-650">Task Fulfillment (TF)</span>
                        <span className="text-indigo-600">{scoreTF.toFixed(1)} / 10.0</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${scoreTF * 10}%` }}
                        />
                      </div>
                    </div>

                    {/* Score Item 2 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-650">Organization (Org)</span>
                        <span className="text-indigo-600">{scoreOrg.toFixed(1)} / 10.0</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${scoreOrg * 10}%` }}
                        />
                      </div>
                    </div>

                    {/* Score Item 3 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-650">Vocabulary (Voc)</span>
                        <span className="text-indigo-600">{scoreVoc.toFixed(1)} / 10.0</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${scoreVoc * 10}%` }}
                        />
                      </div>
                    </div>

                    {/* Score Item 4 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-650">Grammar (Gra)</span>
                        <span className="text-indigo-600">{scoreGra.toFixed(1)} / 10.0</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${scoreGra * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Detailed Feedback Tab */}
                {activeTab === "feedback" && (
                  <div className="space-y-5">
                    {/* Strengths */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] text-emerald-650 font-bold uppercase tracking-wider">Ưu điểm nổi bật</h4>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                        {feedback.strengths?.map((str: string, i: number) => (
                          <li key={i}>{str}</li>
                        )) || <li>Có cấu trúc mạch lạc, đúng format VSTEP.</li>}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Lỗi cần khắc phục</h4>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                        {feedback.weaknesses?.map((str: string, i: number) => (
                          <li key={i}>{str}</li>
                        )) || <li>Bài viết còn lặp từ và mắc lỗi sai cấu trúc tobe.</li>}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Khuyến nghị nâng band</h4>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                        {feedback.recommendedImprovements?.map((str: string, i: number) => (
                          <li key={i}>{str}</li>
                        )) || <li>Sử dụng từ nối chuyển tiếp đa dạng hơn và nâng cao tính học thuật.</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Teacher Comments Tab */}
                {activeTab === "teacher" && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <GraduationCap className="w-5 h-5 text-indigo-500" />
                      <span className="font-bold text-slate-700">Giáo Viên Nhận Xét</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-150">
                      "{submission.teacherComments || "Không có lời nhận xét bổ sung."}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
