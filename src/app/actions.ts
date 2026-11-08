"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sign } from "@/lib/token";

export async function login(_prev: string | null, fd: FormData) {
  if (!process.env.ADMIN_PASSWORD || fd.get("password") !== process.env.ADMIN_PASSWORD)
    return "Wrong password. Check it and try again.";
  (await cookies()).set("session", await sign("admin"), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete("session");
  redirect("/login");
}

export async function addMedicine(fd: FormData) {
  await db.medicine.create({
    data: {
      name: String(fd.get("name")).trim(),
      sku: String(fd.get("sku")).trim(),
      category: String(fd.get("category")).trim() || "General",
      priceCents: Math.round(Number(fd.get("price")) * 100),
      stock: Number(fd.get("stock")) || 0,
      reorderLevel: Number(fd.get("reorderLevel")) || 10,
      expiry: new Date(String(fd.get("expiry"))),
    },
  });
  revalidatePath("/", "layout");
}

export async function restock(fd: FormData) {
  const qty = Number(fd.get("qty"));
  if (qty > 0) await db.medicine.update({ where: { id: String(fd.get("id")) }, data: { stock: { increment: qty } } });
  revalidatePath("/", "layout");
}

export async function deleteMedicine(fd: FormData) {
  await db.medicine.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath("/", "layout");
}

export async function checkout(items: { id: string; qty: number }[]) {
  if (!Array.isArray(items) || items.length === 0)
    return { ok: false as const, error: "The cart is empty." };
  const ids = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !item.id || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 2_147_483_647)
      return { ok: false as const, error: "The cart contains an invalid quantity." };
    if (ids.has(item.id))
      return { ok: false as const, error: "The cart contains a duplicate product." };
    ids.add(item.id);
  }
  try {
    const sale = await db.$transaction(async (tx) => {
      let total = 0;
      const lines = [];
      for (const it of items) {
        const m = await tx.medicine.findUnique({ where: { id: it.id } });
        if (!m || it.qty < 1) throw new Error("An item in the cart no longer exists.");
        const checkoutTime = new Date();
        if (m.expiry <= checkoutTime) throw new Error(`${m.name} is expired and cannot be sold.`);
        if (!Number.isSafeInteger(m.priceCents) || m.priceCents < 0)
          throw new Error(`Invalid price for ${m.name}.`);
        const lineTotal = m.priceCents * it.qty;
        if (!Number.isSafeInteger(lineTotal) || total > 2_147_483_647 - lineTotal)
          throw new Error("The sale total is too large.");
        const r = await tx.medicine.updateMany({
          where: { id: m.id, stock: { gte: it.qty }, expiry: { gt: checkoutTime } },
          data: { stock: { decrement: it.qty } },
        });
        if (r.count === 0) {
          const current = await tx.medicine.findUnique({ where: { id: m.id }, select: { expiry: true } });
          if (!current) throw new Error("An item in the cart no longer exists.");
          if (current.expiry <= new Date()) throw new Error(`${m.name} is expired and cannot be sold.`);
          throw new Error(`Not enough stock for ${m.name}.`);
        }
        total += lineTotal;
        lines.push({ medicineId: m.id, name: m.name, qty: it.qty, priceCents: m.priceCents });
      }
      return tx.sale.create({ data: { totalCents: total, items: { create: lines } } });
    });
    revalidatePath("/", "layout");
    return { ok: true as const, total: sale.totalCents };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Checkout failed." };
  }
}
