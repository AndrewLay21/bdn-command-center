import type { Metadata } from "next";
import { Empty, FilterTabs, PageHeader, Pill, RecordRow, SearchBox } from "@/components/ui";
import { countBy, getAllRecords, type PortfolioItem } from "@/lib/records";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

const PRIORITY_ORDER = ["First", "Next", "Delegated", "Protected learning", "Only if resumed", "Reference"];
const FILTERS: Record<string, [string, (p: PortfolioItem) => boolean]> = {
  active: ["Active", (p) => !["Reference", "Parked", "Done"].includes(p.status)],
  parked: ["Parked", (p) => p.status === "Parked"],
  reference: ["Reference", (p) => p.status === "Reference"],
  done: ["Done", (p) => p.status === "Done"],
  all: ["All", () => true],
};

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ show?: string; q?: string; status?: string; lane?: string }> }) {
  const { show: rawShow, q, status, lane } = await searchParams;
  const show = rawShow && FILTERS[rawShow] ? rawShow : "active";
  const { portfolio } = await getAllRecords();
  const needle = q?.trim().toLowerCase();
  const list = portfolio
    .filter(FILTERS[show][1])
    .filter((p) => !status || p.status === status)
    .filter((p) => !lane || p.lane === lane)
    .filter((p) => !needle || `${p.id} ${p.title} ${p.owner} ${p.lane} ${p.data.summary ?? ""}`.toLowerCase().includes(needle))
    .sort((a, b) => (PRIORITY_ORDER.indexOf(a.priority) + 99) % 99 - (PRIORITY_ORDER.indexOf(b.priority) + 99) % 99 || a.id.localeCompare(b.id, undefined, { numeric: true }));
  const lanes = countBy(portfolio.filter(FILTERS[show][1]), (p) => p.lane);

  return (
    <>
      <PageHeader kicker="Records" title="Portfolio">
        {portfolio.length} items: businesses, projects, steps and reference notes.
      </PageHeader>
      <FilterTabs base="/portfolio" current={show} keep={{ q }} options={Object.entries(FILTERS).map(([k, [label, fn]]) => [k, label, portfolio.filter(fn).length])} />
      <SearchBox action="/portfolio" q={q} show={show} placeholder="Search portfolio" />
      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        {lanes.map(([l, n]) => (
          <a key={l} href={`/portfolio?show=${show}&lane=${encodeURIComponent(l)}`} className={`rounded-lg border px-2.5 py-1 ${lane === l ? "border-gold bg-gold-wash" : "border-line bg-card hover:border-gold"}`}>
            {l} <span className="text-ink-faint">{n}</span>
          </a>
        ))}
        {lane || status ? <a href={`/portfolio?show=${show}`} className="px-2.5 py-1 underline">clear filters</a> : null}
      </div>
      {status ? <p className="mb-4 text-sm text-ink-soft">Status: <strong>{status}</strong></p> : null}
      <div className="paper-card p-2 sm:p-3">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((p) => (
              <RecordRow
                key={p.id}
                href={`/portfolio/${encodeURIComponent(p.id)}`}
                title={p.title}
                meta={[p.id, p.lane, p.owner !== "Not confirmed" ? p.owner : ""].filter(Boolean).join(" · ")}
                pills={<><Pill tone="plain">{p.priority}</Pill><Pill>{p.status}</Pill></>}
              />
            ))}
          </ul>
        ) : (
          <Empty>No portfolio items match.</Empty>
        )}
      </div>
    </>
  );
}
