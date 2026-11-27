import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'YuuZPime',
    time: new Date().toISOString(),
  });
}
