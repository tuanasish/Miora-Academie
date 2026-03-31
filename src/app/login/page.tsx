"use client";
import { useState } from "react";
import { GraduationCap, Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full border border-blue-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="bg-blue-600 p-4 rounded-2xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Miora Académie</h1>
            <p className="text-slate-500 text-sm mt-1">Hệ thống Luyện thi TCF Chuyên nghiệp</p>
          </div>
        </div>

        {status === "sent" ? (
          /* Success state */
          <div className="text-center space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <h2 className="font-bold text-slate-800 text-lg">Kiểm tra email của bạn!</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Em đã gửi link đăng nhập tới <strong>{email}</strong>.<br />
                Bấm vào link đó để vào hệ thống. Link có hiệu lực trong 10 phút.
              </p>
            </div>
            <button
              onClick={() => { setStatus("idle"); setEmail(""); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Dùng email khác
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Đăng nhập</h2>
              <p className="text-sm text-slate-500">
                Nhập email được cấp quyền để nhận link đăng nhập.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@gmail.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                ⚠️ {errorMsg || "Có lỗi xảy ra. Thử lại sau."}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {status === "loading" ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Đang gửi...</>
              ) : (
                <><ArrowRight className="w-5 h-5" />Gửi link đăng nhập</>
              )}
            </button>

            <p className="text-xs text-center text-slate-400">
              Hệ thống đóng — Bạn cần được Admin cấp quyền trước khi đăng nhập.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
