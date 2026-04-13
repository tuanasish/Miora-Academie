import Link from "next/link";
import { Clock3, ShieldCheck, Mail, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

interface PageProps {
  searchParams: Promise<{ login_notified?: string }>;
}

export default async function PendingApprovalPage({ searchParams }: PageProps) {
  const params = await searchParams;

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {params.login_notified === "1" && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            Hoạt động đăng nhập của bạn vừa được thông báo tới admin.
          </div>
        )}

        <div className="rounded-3xl border border-[#e4ddd1] bg-[#faf8f5] p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3">
              <Clock3 className="h-7 w-7 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#3d3d3d]">
                Tài khoản giáo viên đang chờ duyệt
              </h1>
              <p className="mt-1 text-sm text-[#7a746b]">
                Admin cần kích hoạt tài khoản trước khi bạn có thể truy cập khu vực giảng viên.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e4ddd1] bg-white p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3d3d3d]">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Bước tiếp theo
              </div>
              <p className="text-sm leading-6 text-[#6f6a62]">
                Admin sẽ kiểm tra và chuyển trạng thái tài khoản sang <strong>active</strong>.
                Sau khi được duyệt, bạn chỉ cần đăng nhập lại bằng email hiện tại.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4ddd1] bg-white p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3d3d3d]">
                <Mail className="h-4 w-4 text-[#f05e23]" />
                Liên hệ hỗ trợ
              </div>
              <p className="text-sm leading-6 text-[#6f6a62]">
                Nếu bạn cần xử lý gấp, hãy liên hệ admin để được kích hoạt tài khoản giáo viên.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-[#e4ddd1] px-4 py-2 text-sm font-semibold text-[#3d3d3d] hover:bg-white"
            >
              Quay lại trang chủ
            </Link>
            <form action={handleLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#3d3d3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#262626]"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
