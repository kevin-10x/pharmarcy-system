"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/app/actions";
import { money } from "@/lib/format";

type Med = { id: string; name: string; sku: string; category: string; priceCents: number; stock: number };

export default function Pos({ medicines }: { medicines: Med[] }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return medicines.filter((m) => m.name.toLowerCase().includes(s) || m.sku.toLowerCase().includes(s)).slice(0, 12);
  }, [q, medicines]);
  const lines = medicines.filter((m) => cart[m.id]);
  const total = lines.reduce((s, m) => s + m.priceCents * cart[m.id], 0);
  const itemCount = lines.reduce((sum, m) => sum + cart[m.id], 0);

  const add = (m: Med) => {
    setCart((c) => ({ ...c, [m.id]: Math.min(m.stock, (c[m.id] ?? 0) + 1) }));
    setMsg(null);
  };
  const setQty = (m: Med, n: number) =>
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[m.id];
      else next[m.id] = Math.min(m.stock, n);
      return next;
    });

  const pay = () =>
    start(async () => {
      const res = await checkout(lines.map((m) => ({ id: m.id, qty: cart[m.id] })));
      if (res.ok) {
        setCart({});
        setQ("");
        setMsg({ ok: true, text: `Sale complete: ${money(res.total)}` });
        router.refresh();
      }
      else setMsg({ ok: false, text: res.error });
    });

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Point of sale</h1>
        <p className="mt-1 text-sm text-ink/60">Search by product name or SKU, or scan a barcode.</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-3">
          <label htmlFor="product-search" className="sr-only">Search products or scan a barcode</label>
          <input
            id="product-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || pending) return;
              e.preventDefault();
              const sku = q.trim().toLowerCase();
              const product = medicines.find((m) => m.sku.toLowerCase() === sku);
              if (product) {
                add(product);
                setQ("");
              }
            }}
            placeholder="Search name or scan barcode"
            autoFocus
            disabled={pending}
            className="input py-3 text-base"
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {matches.length === 0 && <li className="text-sm text-ink/60">No in-stock products match.</li>}
            {matches.map((m) => (
              <li key={m.id}>
                <button onClick={() => add(m)} disabled={pending} className="flex w-full items-center justify-between gap-3 rounded-lg bg-white p-3 text-left ring-1 ring-ink/10 hover:ring-leaf disabled:opacity-50">
                  <span className="min-w-0"><span className="block truncate font-medium">{m.name}</span><span className="block text-xs text-ink/60">{m.sku} · {m.category} · {m.stock} in stock</span></span>
                  <span className="shrink-0 font-semibold text-leaf">{money(m.priceCents)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="h-fit space-y-4 rounded-xl bg-white p-5 ring-1 ring-ink/10 lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Current sale <span className="font-normal text-ink/60">({itemCount})</span></h2>
            <button
              className="btn-quiet"
              disabled={pending || lines.length === 0}
              onClick={() => { setCart({}); setMsg(null); }}
            >
              Clear
            </button>
          </div>
          {lines.length === 0 ? <p className="text-sm text-ink/60">Add products from the catalog to begin.</p> : (
            <ul className="divide-y divide-ink/10">
              {lines.map((m) => (
                <li key={m.id} className="py-3 text-sm">
                  <div className="mb-2 flex justify-between gap-3">
                    <span className="font-medium">{m.name}</span>
                    <span className="shrink-0">{money(m.priceCents * cart[m.id])}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mr-auto text-xs text-ink/60">{money(m.priceCents)} each</span>
                    <button className="btn-quiet px-2 py-0.5" aria-label={`Remove one ${m.name}`} disabled={pending} onClick={() => setQty(m, cart[m.id] - 1)}>−</button>
                    <span className="w-6 text-center" aria-label={`${cart[m.id]} units`}>{cart[m.id]}</span>
                    <button className="btn-quiet px-2 py-0.5" aria-label={`Add one ${m.name}`} disabled={pending || cart[m.id] >= m.stock} onClick={() => setQty(m, cart[m.id] + 1)}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
          <button className="btn w-full py-3" disabled={pending || lines.length === 0} onClick={pay}>{pending ? "Processing…" : "Complete sale"}</button>
          {msg && <p role="status" className={`text-sm ${msg.ok ? "text-leaf" : "text-alert"}`}>{msg.text}</p>}
        </aside>
      </div>
    </main>
  );
}
