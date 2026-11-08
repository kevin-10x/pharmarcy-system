export const money = (cents: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: process.env.NEXT_PUBLIC_CURRENCY || "USD" }).format(cents / 100);
export const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
