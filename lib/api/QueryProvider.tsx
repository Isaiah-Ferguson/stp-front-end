"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "./client";

/**
 * App-wide TanStack Query client (#34). Shared reference data (programs, staff,
 * participants…) is cached for 60s, so navigating between pages no longer re-fetches
 * the same lists over and over.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // One retry for transient failures — but never retry auth/permission
            // answers (the API client already handles 401-refresh itself).
            retry: (failureCount, error) => {
              if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
