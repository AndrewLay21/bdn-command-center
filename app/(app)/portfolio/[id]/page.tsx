import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldList, PageHeader, Pill } from "@/components/ui";
import { formatWhen, getAllRecords } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function PortfolioDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { portfolio } = await getAllRecords();
  const item = portfolio.find((p) => p.id === decodeURIComponent(id));
  if (!item) notFound();
  return (
    <>
      <Link href="/portfolio" className="text-sm text-gold-ink hover:underline">← Portfolio</Link>
      <div className="mt-4">
        <PageHeader kicker={`${item.lane} · ${item.id}`} title={item.title}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="plain">{item.priority}</Pill>
            <Pill>{item.status}</Pill>
            <span className="text-sm">{item.owner}</span>
            {item.updated ? <span className="text-sm text-ink-faint">Updated {formatWhen(item.updated)}</span> : null}
          </div>
        </PageHeader>
      </div>
      <div className="paper-card p-5 sm:p-7">
        <FieldList data={item.data} skip={["id", "title", "status", "priority", "owner", "lane"]} />
      </div>
    </>
  );
}
