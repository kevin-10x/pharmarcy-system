import { NextRequest, NextResponse } from "next/server";
import { sign } from "@/lib/token";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login")) return NextResponse.next();
  const ok = req.cookies.get("session")?.value === (await sign("admin"));
  return ok ? NextResponse.next() : NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
