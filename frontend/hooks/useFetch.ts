"use client";

import { useEffect, useState } from "react";

export function useFetch<T>(fetchFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await fetchFunction();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fetchFunction]);

  return {
    data,
    loading,
    error,
  };
}