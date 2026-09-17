"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        Checking authentication…
      </div>
    );
  }

  return <>{children}</>;
}
