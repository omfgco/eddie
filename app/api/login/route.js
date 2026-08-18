import { NextResponse } from 'next/server';
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionValue, safeEqual } from '../../../session';

export async function POST(request) {
  const USER = process.env.EDDIE_USER;
  const PASS = process.env.EDDIE_PASSWORD;

  if (!USER || !PASS) {
    return NextResponse.json(
      { error: 'Auth is not configured on the server.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const user = typeof body?.user === 'string' ? body.user : '';
  const pass = typeof body?.pass === 'string' ? body.pass : '';

  // Compare both fields regardless of outcome so a wrong username and a wrong
  // password take the same amount of work.
  const userOk = safeEqual(user, USER);
  const passOk = safeEqual(pass, PASS);

  if (!userOk || !passOk) {
    return NextResponse.json(
      { error: 'Incorrect username or password.' },
      { status: 401 }
    );
  }

  const value = await createSessionValue();
  if (!value) {
    return NextResponse.json({ error: 'Could not create session.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}
