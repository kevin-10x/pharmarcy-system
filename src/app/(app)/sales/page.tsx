import { db } from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Sales() {
  const sales = await db.sale.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { items: true } });
  return (
    <main className="space-y-3">
      <h1 className="text-xl font-bold">Recent sales</h1>
      {sales.length === 0 && <p className="text-sm text-ink/60">No sales yet. Complete one from the Sell page.</p>}
      {sales.map((s) => (
        <article key={s.id} className="rounded-xl bg-white p-4 ring-1 ring-ink/10">
          <div className="flex justify-between font-medium">
            <time>{s.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time>
            <span>{money(s.totalCents)}</span>
          </div>
          <p className="mt-1 text-sm text-ink/70">{s.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</p>
        </article>
      ))}
    </main>
  );
}
