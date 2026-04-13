"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const isLoading = status === "loading";

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        const queryParams = new URLSearchParams(window.location.search);
        if (!cancelled && queryParams.get("error") === "access_denied") {
          setStatus("error");
          setErrorMsg(
            "Lien expiré, compte non autorisé, hoặc callback đăng nhập không hợp lệ.",
          );
        }
        return;
      }

      setStatus("loading");
      setErrorMsg("");

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setErrorMsg("Không thể hoàn tất đăng nhập từ magic link. Vui lòng thử lại.");
        return;
      }

      // Delay browser redirect slightly to allow @supabase/ssr async cookie writer to finish
      // writing to document.cookie from the onAuthStateChange event listener.
      setTimeout(() => {
        window.location.replace("/auth/callback?from=token");
      }, 500);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch("/api/auth/request-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: `${window.location.origin}/login`,
        }),
      });

      const payload = (await response.json().catch(() => null)) as any;

      if (!response.ok) {
        if (response.status === 429 && payload?.error === "RATE_LIMITED") {
          const retryAfterSeconds = Math.max(1, payload.retryAfterSeconds ?? 60);
          const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

          setStatus("error");
          setErrorMsg(
            `Bạn thao tác quá nhanh. Vui lòng thử lại sau khoảng ${retryAfterMinutes} phút.`,
          );
          return;
        }

        setStatus("error");
        setErrorMsg(
           payload?.details ? `Lỗi hệ thống: ${payload.details}` : "Không thể gửi yêu cầu đăng nhập lúc này. Vui lòng thử lại sau ít phút."
        );
        return;
      }

      if (payload?.devModeActionLink) {
        // Automatically navigate the browser to the generated magic link.
        // This prevents double-fetching from pasting into the URL bar and natively sets all client/server cookies!
        window.location.href = payload.devModeActionLink;
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Không thể gửi yêu cầu đăng nhập lúc này. Vui lòng thử lại sau ít phút.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3efe6] flex items-center justify-center p-4">
      <div className="bg-[#faf8f5] rounded-3xl shadow-2xl p-10 max-w-md w-full border border-[#e4ddd1]">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="bg-[#f05e23] p-4 rounded-2xl shadow-lg">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-[#3d3d3d]">
              Miora Académie
            </h1>
            <p className="text-[#888] text-sm mt-1">
              Plateforme professionnelle de préparation au TCF
            </p>
          </div>
        </div>

        {status === "sent" ? (
          <div className="text-center space-y-4 anim-fade-in">
            <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col items-center gap-3 border border-emerald-100">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <h2 className="font-display font-bold text-[#3d3d3d] text-lg">
                Vérifiez votre e-mail
              </h2>
              <p className="text-sm text-[#5d5d5d] leading-relaxed">
                Nếu email đã được admin cấp quyền, một lien de connexion a été envoyé à{" "}
                <strong>{email}</strong>.
                <br />
                Ouvrez ce lien pour accéder à la plateforme. Il est valide 10 minutes.
              </p>
            </div>
            <button
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
              className="text-sm text-[#f05e23] hover:underline font-medium"
            >
              Utiliser un autre e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#3d3d3d] mb-1">
                Connexion
              </h2>
              <p className="text-sm text-[#888]">
                Saisissez l&apos;adresse e-mail que l&apos;admin a déjà créée pour vous.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#5d5d5d]" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#bbb]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@gmail.com"
                  className="w-full pl-11 pr-4 py-3 border border-[#e4ddd1] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05e23]/50 focus:border-[#f05e23] text-sm text-[#3d3d3d] placeholder:text-[#ccc] transition-colors"
                />
              </div>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#f05e23] hover:bg-[#d85118] disabled:bg-[#f05e23]/50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <span className="inline-flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </span>
              <span>{isLoading ? "Envoi en cours..." : "Envoyer le lien de connexion"}</span>
            </button>

            <p className="text-xs text-center text-[#bbb]">
              Plateforme fermée: seuls les comptes créés par l&apos;administrateur peuvent se connecter.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
