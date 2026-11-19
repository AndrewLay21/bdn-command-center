import Link from "next/link";

const TONES: Record<string, string> = {
  alert: "bg-alert-wash text-alert border-alert/20",
  ok: "bg-ok-wash text-ok border-ok/20",
  gold: "bg-gold-wash text-gold-ink border-gold/40",
  plain: "bg-paper-deep text-ink-soft border-line",
};

export function toneFor(status: string): keyof typeof TONES {
  const s = status.toLowerCase();
  if (["blocked", "hold"].some((k) => s.includes(k))) return "alert";
  if (["complete", "approved", "done"].some((k) => s.includes(k))) return "ok";
  if (["progress", "review", "assigned", "working", "first", "p0", "high"].some((k) => s.includes(k))) return "gold";
  return "plain";
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  const t = tone ?? toneFor(String(children ?? ""));
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[t]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8">
      {kicker ? <p className="text-xs font-semibold tracking-[0.18em] text-gold-ink uppercase">{kicker}</p> : null}
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{title}</h1>
      <div className="rule-gold mt-4" />
      {children ? <div className="mt-4 text-ink-soft">{children}</div> : null}
    </header>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="paper-card p-5 sm:p-7">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function RecordRow({ href, title, meta, pills }: { href: string; title: string; meta?: string; pills?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group block rounded-xl px-3 py-3 transition hover:bg-paper-deep sm:px-4">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="font-medium text-ink group-hover:underline group-hover:decoration-gold group-hover:decoration-2 group-hover:underline-offset-4">{title}</p>
            {meta ? <p className="mt-0.5 truncate text-sm text-ink-faint">{meta}</p> : null}
          </div>
          {pills ? <div className="flex shrink-0 flex-wrap gap-1.5">{pills}</div> : null}
        </div>
      </Link>
    </li>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-ink-faint">{children}</p>;
}

export function FilterTabs({ base, current, options, keep }: { base: string; current: string; options: [string, string, number?][]; keep?: Record<string, string | undefined> }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter">
      {options.map(([value, label, count]) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(keep ?? {})) if (v) params.set(k, v);
        params.set("show", value);
        const active = current === value;
        return (
          <Link
            key={value}
            href={`${base}?${params}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-gold bg-gold text-[#17191e]" : "border-line bg-card text-ink-soft hover:border-gold"}`}
          >
            {label}
            {count !== undefined ? <span className={`ml-1.5 ${active ? "text-[#17191e]" : "text-ink-faint"}`}>{count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function SearchBox({ action, q, show, placeholder }: { action: string; q?: string; show?: string; placeholder: string }) {
  return (
    <form action={action} className="mb-5 flex gap-2" role="search">
      {show ? <input type="hidden" name="show" value={show} /> : null}
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-2.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/40"
      />
      <button className="rounded-xl border border-gold bg-gold px-4 py-2.5 text-sm font-semibold text-[#17191e]">Search</button>
    </form>
  );
}

/** Shows every original field of a record, in plain text. */
export function FieldList({ data, skip = [] }: { data: Record<string, unknown>; skip?: string[] }) {
  const entries = Object.entries(data).filter(([k, v]) => !skip.includes(k) && v !== null && v !== "" && v !== "[]");
  return (
    <dl className="divide-y divide-line">
      {entries.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
          <dt className="text-sm font-semibold text-ink-soft">{labelize(k)}</dt>
          <dd className="min-w-0 text-[15px] break-words whitespace-pre-wrap">{renderValue(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function labelize(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function renderValue(v: unknown): React.ReactNode {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const s = String(v);
  if (s.startsWith("[") || s.startsWith("{")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.every((x) => x && typeof x === "object" && "url" in x)) {
        return (
          <ul className="space-y-1">
            {parsed.map((l: { url: string; label?: string }, i: number) => (
              <li key={i}>
                <a href={l.url} target="_blank" rel="noreferrer noopener" className="underline decoration-gold decoration-2 underline-offset-4">
                  {l.label || l.url}
                </a>
              </li>
            ))}
          </ul>
        );
      }
      if (Array.isArray(parsed)) return parsed.map(String).join(", ");
      return <code className="block rounded-lg bg-paper-deep p-3 text-xs">{JSON.stringify(parsed, null, 2)}</code>;
    } catch {
      return s;
    }
  }
  if (/^https?:\/\//.test(s) && !s.includes(" ")) {
    return (
      <a href={s} target="_blank" rel="noreferrer noopener" className="underline decoration-gold decoration-2 underline-offset-4">
        {s}
      </a>
    );
  }
  return s;
}
