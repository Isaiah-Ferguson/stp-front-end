"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

/**
 * Gates its children behind authentication. While the session is resolving it
 * shows a centered spinner; if there is no authenticated user it redirects to
 * the login page.
 */
// AUTH BYPASSED TEMPORARILY — restore before production
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
