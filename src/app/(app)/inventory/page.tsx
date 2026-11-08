import { db } from "@/lib/db";
import { addMedicine, deleteMedicine, restock } from "@/app/actions";
import { day, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Inventory({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const meds = await db.medicine.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { name: "asc" },
  });

  return (
    <main className="space-y-8">
      <form action={addMedicine} className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-ink/10 sm:grid-cols-3 lg:grid-cols-4">
        <h2 className="font-semibold sm:col-span-3 lg:col-span-4">Add a product</h2>
        <input name="name" placeholder="Name (e.g. Amoxicillin 500mg)" required className="input" />
        <input name="sku" placeholder="SKU / barcode" required className="input" />
        <input name="category" placeholder="Category" className="input" />
        <input name="price" type="number" step="0.01" min="0" placeholder="Price" required className="input" />
        <input name="stock" type="number" min="0" placeholder="Quantity in stock" required className="input" />
        <input name="reorderLevel" type="number" min="0" placeholder="Reorder at (default 10)" className="input" />
        <input name="expiry" type="date" required aria-label="Expiry date" className="input" />
        <button className="btn">Add product</button>
      </form>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name or SKU" className="input max-w-sm" />
        <button className="btn-quiet">Search</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/60">
            <tr><th className="p-3">Product</th><th>Price</th><th className="w-48">Stock</th><th>Expiry</th><th>Restock</th><th /></tr>
          </thead>
          <tbody>
            {meds.length === 0 && <tr><td colSpan={6} className="p-6 text-ink/60">No products found. Add one above.</td></tr>}
            {meds.map((m) => {
              const pct = Math.min(100, (m.stock / Math.max(m.reorderLevel * 3, 1)) * 100);
              const low = m.stock <= m.reorderLevel;
              return (
                <tr key={m.id} className="border-b border-ink/5 last:border-0">
                  <td className="p-3"><div className="font-medium">{m.name}</div><div className="text-xs text-ink/60">{m.sku} · {m.category}</div></td>
                  <td>{money(m.priceCents)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-ink/10">
                        <div className={`h-full ${low ? "bg-amber" : "bg-leaf"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={low ? "font-semibold text-amber" : ""}>{m.stock}</span>
                    </div>
                  </td>
                  <td className={m.expiry < new Date() ? "text-alert" : ""}>{day(m.expiry)}</td>
                  <td>
                    <form action={restock} className="flex gap-1">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="qty" type="number" min="1" placeholder="+qty" aria-label={`Add stock for ${m.name}`} className="input w-20 py-1" />
                      <button className="btn-quiet">Add</button>
                    </form>
                  </td>
                  <td className="pr-3 text-right">
                    <form action={deleteMedicine}><input type="hidden" name="id" value={m.id} /><button className="text-alert hover:underline">Delete</button></form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
