import { db } from "@/lib/db";
import Pos from "./Pos";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const meds = await db.medicine.findMany({
    where: { stock: { gt: 0 }, expiry: { gt: new Date() } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, category: true, priceCents: true, stock: true },
  });
  return <Pos medicines={meds} />;
}
