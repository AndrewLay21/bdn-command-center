"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Owner password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-1.5 block w-full rounded-xl border border-line bg-card px-4 py-3 text-base text-ink shadow-inner outline-none focus:border-gold focus:ring-2 focus:ring-gold/40"
        />
      </label>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-alert-wash px-3 py-2 text-sm text-alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-ink px-4 py-3 text-base font-semibold text-paper transition hover:bg-black disabled:opacity-60"
      >
        {pending ? "Checking…" : "Open the Command Center"}
      </button>
    </form>
  );
}
