import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GraduationCap, LogIn } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center space-y-8 p-10 bg-white shadow-xl rounded-2xl max-w-md w-full mx-4 border border-blue-100">
        <div className="bg-blue-600 p-4 rounded-2xl">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Miora Académie</h1>
          <p className="text-slate-500">Hệ thống Luyện thi TCF Chuyên nghiệp</p>
        </div>
        <div className="w-full space-y-4 pt-4">
          <Link
            href="/login"
            className="flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập
          </Link>
          <p className="text-center text-xs text-slate-400">
            Hệ thống đóng: Cần được Admin cấp quyền để vào
          </p>
        </div>
      </main>
    </div>
  );
}
