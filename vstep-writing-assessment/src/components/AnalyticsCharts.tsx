// src/components/AnalyticsCharts.tsx
"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Award, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

interface AnalyticsChartsProps {
  data: {
    scoreHistory: Array<{ date: string; score: number; taskType: string }>;
    commonGrammar: Array<{ name: string; count: number }>;
    commonVocab: Array<{ name: string; count: number }>;
    stats: {
      total: number;
      graded: number;
      average: number;
    };
  };
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const { scoreHistory, commonGrammar, commonVocab, stats } = data;

  return (
    <div className="space-y-8">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-150 text-violet-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Điểm Trung Bình Lớp</div>
            <div className="text-3xl font-extrabold text-slate-800">{stats.average > 0 ? stats.average.toFixed(1) : "N/A"}</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đã Chấm Điểm</div>
            <div className="text-3xl font-extrabold text-slate-800">
              {stats.graded} <span className="text-slate-400 text-sm font-semibold">/ {stats.total} bài</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Bài Viết Học Viên</div>
            <div className="text-3xl font-extrabold text-slate-800">{stats.total}</div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-850 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          Biểu đồ Điểm Số Qua Các Bài Viết
        </h3>
        
        {scoreHistory.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 font-medium">
            Chưa có đủ dữ liệu lịch sử để hiển thị biểu đồ điểm.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreHistory} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} fontWeight={600} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#f8fafc" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Điểm VSTEP"
                  stroke="#6366f1"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  dot={{ stroke: "#4f46e5", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Error Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grammar Errors Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Lỗi Ngữ Pháp Thường Gặp Nhất
          </h3>

          {commonGrammar.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium">
              Chưa phát hiện lỗi ngữ pháp nào.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={commonGrammar}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#f8fafc" }}
                  />
                  <Bar dataKey="count" name="Số lần lặp lại" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Vocabulary Errors Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Lỗi Từ Vựng Cần Cải Thiện
          </h3>

          {commonVocab.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium">
              Chưa phát hiện lỗi từ vựng nào.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={commonVocab}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#f8fafc" }}
                  />
                  <Bar dataKey="count" name="Số lần lặp lại" fill="#f97316" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
