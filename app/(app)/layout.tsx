import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { logout } from "../login/actions";
import NavLinks from "./nav-links";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink font-serif text-sm font-bold text-gold">BD</span>
            <span className="hidden font-serif text-lg font-bold sm:inline">Command Center</span>
          </Link>
          <NavLinks />
          <form action={logout}>
            <button className="rounded-lg px-2 py-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6 sm:pt-12">{children}</main>
    </div>
  );
}
