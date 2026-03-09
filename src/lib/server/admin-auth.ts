import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "neuro_admin";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function getAdminCookieValue() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return null;
  }

  return hashPassword(password);
}

export function isPasswordValid(password: string) {
  const expected = getAdminCookieValue();
  if (!expected) {
    return false;
  }

  const received = hashPassword(password);
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const expected = getAdminCookieValue();

  if (!expected) {
    return false;
  }

  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === expected;
}

export { ADMIN_COOKIE_NAME };
