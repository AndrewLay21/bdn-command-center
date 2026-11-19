"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN = [
  ["/", "Home", "⌂"],
  ["/money", "Money", "◎"],
  ["/avengers", "Avengers", "★"],
  ["/portfolio", "Projects", "▣"],
  ["/decisions", "Decisions", "✓"],
] as const;
const MORE = [
  ["/inbox", "Agent inbox"],
  ["/tickets", "Task tickets"],
] as const;
const ALL: readonly (readonly [string, string, ...string[]])[] = [...MAIN, ...MORE, ["/tasks", "Work records"]];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export default function NavLinks() {
  const path = usePathname();
  const moreOpen = MORE.some(([h]) => isActive(path, h));
  return (
    <nav aria-label="Main navigation">
      {MAIN.map(([href, label, icon]) => {
        const active = isActive(path, href);
        return (
          <Link key={href} href={href} className={`pc-navbtn ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
            <span aria-hidden="true" className="cc-icon">{icon}</span>{label}
          </Link>
        );
      })}
      <Link className={`pc-nav-records ${isActive(path, "/tasks") ? "active" : ""}`} href="/tasks" aria-current={isActive(path, "/tasks") ? "page" : undefined}>▤ Work records</Link>
      <details className="pc-nav-more" open={moreOpen || undefined}>
        <summary>More tools</summary>
        {MORE.map(([href, label]) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} className={`pc-navbtn ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>{label}</Link>
          );
        })}
      </details>
    </nav>
  );
}

export function TopCrumb() {
  const path = usePathname();
  const hit = [...ALL].sort((a, b) => b[0].length - a[0].length).find(([h]) => isActive(path, h));
  return (
    <div><span>Big Dreams / Command Center</span><span aria-hidden="true">›</span><b>{hit?.[1] ?? "Home"}</b></div>
  );
}
