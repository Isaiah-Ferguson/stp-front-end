import AdminSidebar from "../components/AdminSidebar";

/**
 * Admin portal shell — persistent sidebar + main column.
 * Each page renders its own <div className="adm-main"> with topbar + content.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="adm-shell">
      <AdminSidebar />
      {children}
    </div>
  );
}
