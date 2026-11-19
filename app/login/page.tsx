import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const jar = await cookies();
  if (await verifySessionToken(jar.get(SESSION_COOKIE)?.value)) redirect(safeNext(next));
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div className="paper-card px-7 py-9 sm:px-9">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-serif text-lg font-bold text-gold">BD</span>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-ink uppercase">Big Dreams Network</p>
            <h1 className="text-2xl font-bold">Command Center</h1>
          </div>
        </div>
        <div className="rule-gold mt-6" />
        <p className="mt-4 text-ink-soft">Private. Only Coach Drew&apos;s team can open this.</p>
        <LoginForm next={safeNext(next)} />
      </div>
    </main>
  );
}
