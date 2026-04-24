import { NextResponse } from 'next/server';
import { authService } from '@/server/services/auth.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await authService.register(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACCOUNT_EXISTS') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unable to create account. Try signing in or using a different email.'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create account.'
      },
      { status: 400 }
    );
  }
}
