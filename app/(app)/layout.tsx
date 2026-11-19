import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { logout } from "../login/actions";
import { Portrait } from "@/components/portrait";
import { agentById } from "@/lib/team";
import NavLinks, { TopCrumb } from "./nav-links";
import "../legacy-styles/plain-center.css";
import "../legacy-styles/avengers.css";
import "../legacy-styles/executive-views.css";
import "../legacy-styles/cc-v2.css";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return (
    <div className="pc-shell avengers-shell">
      <a className="mc-skip" href="#mission-content">Skip to content</a>
      <aside className="pc-side">
        <Link href="/" className="pc-brand">
          <span>BD<span>↗</span></span>
          <div>BIG DREAMS<small>AVENGERS COMMAND CENTER</small></div>
        </Link>
        <div className="pc-side-label">EXECUTIVE OFFICE</div>
        <NavLinks />
        <div className="pc-side-bottom">
          <div className="ex-owner"><Portrait agent={agentById("coach")} /><span>Coach Drew<small>Founder</small></span></div>
          <p>🔒 Private to you</p>
        </div>
      </aside>
      <main className="pc-main">
        <header className="pc-top">
          <TopCrumb />
          <form action={logout}><button type="submit">Sign out</button></form>
        </header>
        <div className="pc-content" id="mission-content" tabIndex={-1}>{children}</div>
        <footer className="pc-footer cc-footer"><span>BIG DREAMS NETWORK / EXECUTIVE OFFICE</span><span>All times Eastern</span></footer>
      </main>
    </div>
  );
}
