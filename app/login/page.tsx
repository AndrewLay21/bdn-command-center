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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-2xl border border-[#706044] bg-[linear-gradient(115deg,#20252d,#101318_64%,#392c1955)] px-6 py-9 shadow-[0_25px_60px_#0007,inset_0_1px_#edcf8d66] sm:px-9">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[10px] bg-[linear-gradient(140deg,#f1d798,#a17b37)] text-lg font-extrabold text-[#13161b]">BD</span>
          <div>
            <p className="text-sm font-extrabold tracking-[0.08em] text-ink">BIG DREAMS</p>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-ink-soft">AVENGERS COMMAND CENTER</p>
          </div>
        </div>
        <div className="rule-gold mt-6" />
        <h1 className="mt-5 text-2xl font-bold">Welcome back, Coach.</h1>
        <p className="mt-2 text-ink-soft">Private. Only Coach Drew&apos;s team can open this.</p>
        <LoginForm next={safeNext(next)} />
      </div>
    </main>
  );
}
