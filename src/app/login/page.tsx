"use client";
import { useActionState } from "react";
import { login } from "../actions";

export default function Login() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-ink/10">
        <h1 className="text-2xl font-bold">{process.env.NEXT_PUBLIC_PHARMACY_NAME || "Pharmacy"}</h1>
        <p className="text-sm text-ink/70">Sign in to manage stock and sales.</p>
        <label className="block text-sm font-medium">
          Staff password
          <input name="password" type="password" required autoFocus className="input mt-1" />
        </label>
        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
        <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
