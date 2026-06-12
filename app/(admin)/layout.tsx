import AdminSidebar from "../components/AdminSidebar";
import { AuthGuard } from "@/lib/auth/AuthGuard";

/**
 * Admin portal shell — persistent sidebar + main column.
 * Gated behind authentication; unauthenticated users are sent to the login page.
 * Each page renders its own <div className="adm-main"> with topbar + content.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <div className="adm-shell">
        <AdminSidebar />
        {children}
      </div>
    </AuthGuard>
  );
}
