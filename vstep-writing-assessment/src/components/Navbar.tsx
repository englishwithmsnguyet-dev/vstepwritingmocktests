// src/components/Navbar.tsx
"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenTool, LogOut, LayoutDashboard, FileSpreadsheet, BarChart2, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as any)?.role;
  const isTeacher = role === "TEACHER";

  const navItems = isTeacher
    ? [
        { label: "Bài Nộp Lớp Học", href: "/teacher", icon: FileSpreadsheet },
        { label: "Báo Cáo Phân Tích", href: "/teacher/analytics", icon: BarChart2 },
      ]
    : [
        { label: "Bảng Điều Khiển", href: "/dashboard", icon: LayoutDashboard },
        { label: "Luyện Viết Mới", href: "/dashboard/submit", icon: PenTool },
      ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <PenTool className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight hover:text-indigo-400 transition-colors">
                VSTEP WRITING
              </span>
            </Link>

            {/* Nav Links */}
            {session && (
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* User profile dropdown/signout */}
          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    className="w-8 h-8 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-100">{session.user?.name || "Học viên"}</div>
                  <div className="text-[10px] text-indigo-400 font-extrabold tracking-wide uppercase">
                    {isTeacher ? "Giáo viên" : "Học viên"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Links */}
      {session && (
        <div className="md:hidden flex border-t border-slate-850 px-2 py-1.5 space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-350 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
