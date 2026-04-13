import { NextRequest, NextResponse } from 'next/server';

import { resetInactiveStreaks } from '@/app/actions/streak.actions';
import { verifyCronRequest } from '@/lib/security/cron';

/**
 * Cron endpoint: Reset streak cho học viên không hoạt động.
 * Gọi bởi: Vercel Cron / external cron service mỗi ngày lúc 00:05 (VN time).
 * 
 * Bảo mật: Kiểm tra CRON_SECRET header để tránh bị gọi từ bên ngoài.
 * Cấu hình: Thêm CRON_SECRET vào .env
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const result = await resetInactiveStreaks();
    return NextResponse.json({
      ok: true,
      message: `Reset ${result.resetCount} streak(s)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[streak-reset] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
