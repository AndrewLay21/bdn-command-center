"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/", "Today"],
  ["/tasks", "Tasks"],
  ["/tickets", "Tickets"],
  ["/portfolio", "Portfolio"],
] as const;

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto text-sm sm:order-none sm:mx-0 sm:w-auto" aria-label="Main">
      {LINKS.map(([href, label]) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-center whitespace-nowrap transition sm:flex-none sm:px-3 ${active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-deep hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
