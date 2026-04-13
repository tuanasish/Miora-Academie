import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Submission notifications now happen server-side.' },
    { status: 410 },
  );
}
