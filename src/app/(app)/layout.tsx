import Link from "next/link";
import { logout } from "../actions";

const links = [
  { href: "/", label: "Overview" },
  { href: "/pos", label: "POS" },
  { href: "/inventory", label: "Inventory" },
  { href: "/sales", label: "Sales" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
        <span className="mr-auto text-lg font-bold text-leaf">{process.env.NEXT_PUBLIC_PHARMACY_NAME || "Pharmacy"}</span>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-ink/5">{l.label}</Link>
          ))}
        </nav>
        <form action={logout}><button className="btn-quiet">Sign out</button></form>
      </header>
      {children}
    </div>
  );
}
