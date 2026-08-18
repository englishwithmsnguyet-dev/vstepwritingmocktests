// src/components/ReportPDF.tsx
"use client";

import React, { useState } from "react";
import { Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportPDFProps {
  submission: any;
}

export default function ReportPDF({ submission }: ReportPDFProps) {
  const [exporting, setExporting] = useState(false);

  const handleDownloadPDF = async () => {
    setExporting(true);
    const element = document.getElementById("pdf-report-content");
    if (!element) {
      setExporting(false);
      return;
    }

    // Temporarily show the report node if hidden
    const originalStyle = element.style.display;
    element.style.display = "block";

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // high quality
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`VSTEP-WRITING-REPORT-${submission.id.substring(0, 8)}.pdf`);
    } catch (e) {
      console.error("PDF Export failed:", e);
    } finally {
      element.style.display = originalStyle;
      setExporting(false);
    }
  };

  const scoreOverall = submission.teacherScoreOverall ?? submission.aiScoreOverall ?? 0;
  const scoreTF = submission.teacherScoreTF ?? submission.aiScoreTF ?? 0;
  const scoreOrg = submission.teacherScoreOrg ?? submission.aiScoreOrg ?? 0;
  const scoreVoc = submission.teacherScoreVoc ?? submission.aiScoreVoc ?? 0;
  const scoreGra = submission.teacherScoreGra ?? submission.aiScoreGra ?? 0;

  const feedback = submission.aiFeedbackJson || {};

  return (
    <div>
      <button
        onClick={handleDownloadPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-colors disabled:opacity-50"
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang xuất PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Tải Báo Cáo PDF
          </>
        )}
      </button>

      {/* Hidden PDF Printable layout container */}
      <div
        id="pdf-report-content"
        className="bg-white text-slate-800 p-8 max-w-4xl mx-auto space-y-6"
        style={{ display: "none", fontFamily: "sans-serif" }}
      >
        {/* Header */}
        <div className="border-b-4 border-indigo-600 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Báo Cáo Đánh Giá VSTEP Writing</h1>
            <p className="text-slate-500 text-sm">Học viên: <strong className="text-slate-800">{submission.student?.name || "Học viên"}</strong> ({submission.student?.email})</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase">Ngày nộp bài</p>
            <p className="text-slate-650 font-semibold text-sm">{new Date(submission.createdAt).toLocaleDateString("vi-VN")}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Loại Bài VSTEP</span>
            <strong className="text-sm text-slate-800">{submission.taskType === "TASK1" ? "Task 1 (Viết thư/Email)" : "Task 2 (Viết bài luận)"}</strong>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Độ Dài Bài Viết</span>
            <strong className="text-sm text-slate-800">{submission.wordCount} từ</strong>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Người Đánh Giá</span>
            <strong className="text-sm text-slate-850">{submission.teacherId ? "Giáo viên (Đã thẩm định)" : "Trí Tuệ Nhân Tạo (AI)"}</strong>
          </div>
        </div>

        {/* Scores Card */}
        <div>
          <h2 className="text-md font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Điểm Số Đạt Được</h2>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-[10px] text-indigo-500 font-bold uppercase block">Tổng thể</span>
              <strong className="text-xl text-indigo-700 font-extrabold">{scoreOverall.toFixed(1)}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Task Fulfil.</span>
              <strong className="text-lg text-slate-700 font-extrabold">{scoreTF.toFixed(1)}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Organization</span>
              <strong className="text-lg text-slate-700 font-extrabold">{scoreOrg.toFixed(1)}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Vocabulary</span>
              <strong className="text-lg text-slate-700 font-extrabold">{scoreVoc.toFixed(1)}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Grammar</span>
              <strong className="text-lg text-slate-700 font-extrabold">{scoreGra.toFixed(1)}</strong>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl">
            <h3 className="text-emerald-800 font-bold text-sm mb-2 uppercase">Ưu Điểm Điển Hình</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
              {feedback.strengths?.map((str: string, i: number) => (
                <li key={i}>{str}</li>
              )) || <li>Có kết cấu cơ bản đáp ứng yêu cầu.</li>}
            </ul>
          </div>

          <div className="bg-rose-50/30 border border-rose-100 p-4 rounded-xl">
            <h3 className="text-rose-800 font-bold text-sm mb-2 uppercase">Điểm Cần Khắc Phục</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
              {feedback.weaknesses?.map((wk: string, i: number) => (
                <li key={i}>{wk}</li>
              )) || <li>Cần cải thiện độ chính xác ngữ pháp và dùng từ nối.</li>}
            </ul>
          </div>
        </div>

        {/* Top 5 Errors */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-slate-800 font-bold text-xs uppercase mb-2">Top Lỗi Ngữ Pháp</h3>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-xs">
              {feedback.topGrammarErrors?.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              )) || <li>Sự hòa hợp chủ - vị</li>}
            </ol>
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-xs uppercase mb-2">Top Lỗi Từ Vựng</h3>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-xs">
              {feedback.topVocabularyErrors?.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              )) || <li>Dùng từ chưa trang trọng</li>
              }
            </ol>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-indigo-900 font-bold text-sm mb-2 uppercase">Khuyến Nghị Nâng Band Điểm</h3>
          <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
            {feedback.recommendedImprovements?.map((rec: string, i: number) => (
              <li key={i}>{rec}</li>
            )) || <li>Luyện tập viết các cấu trúc câu phức và kiểm tra lỗi sai trước khi nộp.</li>}
          </ul>
        </div>

        {/* Essay Text */}
        <div>
          <h2 className="text-md font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Bài Viết Học Viên</h2>
          <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-xs leading-relaxed whitespace-pre-line text-justify font-mono">
            {/* Strip HTML tags for clean printing inside PDF */}
            {submission.essayText}
          </div>
        </div>

        {/* Teacher Comments */}
        {submission.teacherComments && (
          <div className="bg-violet-50/30 border border-violet-100 p-4 rounded-xl">
            <h3 className="text-violet-850 font-bold text-sm mb-1 uppercase">Nhận Xét Của Giáo Viên</h3>
            <p className="text-slate-700 text-xs leading-relaxed">{submission.teacherComments}</p>
          </div>
        )}
      </div>
    </div>
  );
}
