import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Same owner lock the private pages use (lib/auth.ts), for API route handlers.
 * Pages redirect to /login; API routes must answer JSON, so this returns a 401
 * Response when the caller is not the signed-in owner, or null when it is.
 *
 * Every /api/t3/* handler calls this FIRST, so the password gate sits in front
 * of every function that can reach T3. On Netlify these handlers run behind the
 * same site, so the site-wide password prompt applies too; this is the second lock.
 */
export async function ownerGuard(): Promise<NextResponse | null> {
  const jar = await cookies();
  const ok = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (ok) return null;
  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}
