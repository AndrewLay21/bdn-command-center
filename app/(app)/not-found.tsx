import Link from "next/link";
export default function NotFound() {
  return (
    <div className="paper-card p-8 text-center">
      <h1 className="text-2xl font-bold">Can&apos;t find that record.</h1>
      <Link href="/" className="mt-4 inline-block text-gold-ink underline">Back to today</Link>
    </div>
  );
}
