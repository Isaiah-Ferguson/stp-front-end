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
      {/* Keyboard users can jump past the sidebar on every admin page. */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="adm-shell">
        <AdminSidebar />
        <div id="main-content" style={{ display: "contents" }}>
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
