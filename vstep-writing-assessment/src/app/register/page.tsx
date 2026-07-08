// src/app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ShieldAlert, Sparkles, Mail, Lock, User, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Đã xảy ra lỗi khi đăng ký.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2500);
      }
    } catch (err) {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white min-h-screen">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-indigo-400 font-bold hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
        </Link>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Đăng Ký Thành Công!</h3>
            <p className="text-slate-400 text-sm">Tài khoản của bạn đã được khởi tạo. Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold mb-2">Tạo Tài Khoản</h3>
            <p className="text-slate-400 text-sm mb-6">Đăng ký tham gia hệ thống VSTEP Writing Miss Nguyet</p>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm mb-4">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold uppercase mb-1.5">Họ và Tên</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200 text-sm"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold uppercase mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200 text-sm"
                    placeholder="hocvien@gmail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold uppercase mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-200 text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Đăng ký tài khoản
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
