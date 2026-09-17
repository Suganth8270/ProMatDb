"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function LoginPageContent() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Sign in to ProMatDB</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Use your Django account to access protected interaction data.</p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">{error}</p>}
        <label className="mt-6 block text-sm font-medium text-[var(--color-text)]">
          Username
          <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-[var(--color-text)]" />
        </label>
        <label className="mt-4 block text-sm font-medium text-[var(--color-text)]">
          Password
          <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-[var(--color-text)]" />
        </label>
        <button disabled={submitting || loading} type="submit" className="mt-6 w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
