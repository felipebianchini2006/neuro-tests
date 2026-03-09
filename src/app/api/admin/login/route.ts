import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getAdminCookieValue,
  isPasswordValid,
} from "@/lib/server/admin-auth";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || !isPasswordValid(password)) {
    return NextResponse.json(
      { error: "Senha inválida." },
      { status: 401 },
    );
  }

  const cookieValue = getAdminCookieValue();
  if (!cookieValue) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD não configurado." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
