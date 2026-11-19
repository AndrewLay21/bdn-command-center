"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { loginBlocked, recordLogin } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, passwordConfigured, passwordMatches } from "@/lib/session";

export type LoginState = { error?: string };

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!passwordConfigured()) return { error: "The owner password is not set up on this site yet." };
  const ip = await clientIp();
  if (await loginBlocked(ip)) return { error: "Too many tries. Wait 15 minutes, then try again." };

  const password = String(form.get("password") ?? "").slice(0, 512);
  const ok = await passwordMatches(password);
  await recordLogin(ip, ok);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "That password didn't work." };
  }
  const token = await createSessionToken();
  if (!token) return { error: "The owner password is not set up on this site yet." };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  redirect("/login");
}
