"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/contexts/AuthContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create a QueryClient instance with default options
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global defaults for queries
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 401/403 (auth errors)
              const statusCode = (error as { response?: { status?: number } })
                ?.response?.status;
              if (statusCode === 401 || statusCode === 403) return false;

              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
            refetchOnWindowFocus: false, // Disable refetch on window focus by default
          },
          mutations: {
            // Global defaults for mutations
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
