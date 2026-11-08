import { db } from "@/lib/db";
import { day, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const soon = new Date(Date.now() + 60 * 864e5);
  const [meds, today] = await Promise.all([
    db.medicine.findMany({ orderBy: { name: "asc" } }),
    db.sale.aggregate({ where: { createdAt: { gte: start } }, _sum: { totalCents: true }, _count: true }),
  ]);
  const low = meds.filter((m) => m.stock <= m.reorderLevel);
  const expiring = meds.filter((m) => m.expiry <= soon).sort((a, b) => +a.expiry - +b.expiry);
  const value = meds.reduce((s, m) => s + m.priceCents * m.stock, 0);

  return (
    <main className="space-y-8">
      <p className="text-2xl leading-snug">
        Today: <strong>{today._count}</strong> sales totalling <strong>{money(today._sum.totalCents ?? 0)}</strong>.
        Shelves hold <strong>{meds.length}</strong> products worth <strong>{money(value)}</strong> at retail.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <List title="Reorder now" empty="Nothing is running low." rows={low.map((m) => ({ id: m.id, name: m.name, note: `${m.stock} left (reorder at ${m.reorderLevel})`, tone: "text-amber" }))} />
        <List title="Expiring within 60 days" empty="No stock is close to expiry." rows={expiring.map((m) => ({ id: m.id, name: m.name, note: m.expiry < new Date() ? `Expired ${day(m.expiry)}` : day(m.expiry), tone: m.expiry < new Date() ? "text-alert" : "text-amber" }))} />
      </div>
    </main>
  );
}

function List({ title, empty, rows }: { title: string; empty: string; rows: { id: string; name: string; note: string; tone: string }[] }) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-ink/10">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-ink/60">{empty}</p> : (
        <ul className="divide-y divide-ink/10">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-4 py-2 text-sm">
              <span>{r.name}</span><span className={r.tone}>{r.note}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
