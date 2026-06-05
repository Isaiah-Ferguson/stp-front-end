import Link from "next/link";

/**
 * Dashboard page — the main entry point after login.
 * Establishes the base app shell (sidebar + topbar) from the
 * Shining Stars design system. Add CRM features as the project grows.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar */}
      <aside className="ss-sidebar">
        <div className="flex items-center gap-2 px-3">
          <span className="ss-avatar sm admin" aria-hidden="true">
            SS
          </span>
          <span style={{ fontWeight: "var(--w-medium)" }}>Shining Stars</span>
        </div>

        <nav className="ss-nav-section">
          <span className="ss-nav-section-label">Workspace</span>
          <Link href="/dashboard" className="ss-nav-item is-active">
            <span className="ss-nav-label">Dashboard</span>
          </Link>
          <a className="ss-nav-item">
            <span className="ss-nav-label">Participants</span>
          </a>
          <a className="ss-nav-item">
            <span className="ss-nav-label">Attendance</span>
          </a>
          <a className="ss-nav-item">
            <span className="ss-nav-label">Calendar</span>
          </a>
        </nav>

        <nav className="ss-nav-section">
          <span className="ss-nav-section-label">Admin</span>
          <a className="ss-nav-item">
            <span className="ss-nav-label">Staff</span>
          </a>
          <a className="ss-nav-item">
            <span className="ss-nav-label">Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="ss-topbar">
          <div className="ss-topbar-titles">
            <div className="ss-breadcrumb">
              <Link href="/">Home</Link>
              <span className="sep">/</span>
              <span>Dashboard</span>
            </div>
            <h1>Dashboard</h1>
          </div>
          <div className="ss-topbar-actions">
            <a
              href="http://localhost:5000/swagger"
              target="_blank"
              rel="noopener noreferrer"
              className="ss-btn"
            >
              API docs
            </a>
            <button type="button" className="ss-btn ss-btn-primary">
              Add participant
            </button>
          </div>
        </header>

        <main
          className="flex-1 flex flex-col"
          style={{ padding: "var(--space-6) var(--page-pad-x)", gap: "var(--section-gap)" }}
        >
          {/* Stat grid */}
          <div className="ss-statgrid">
            {[
              { label: "Participants", value: "—" },
              { label: "Active", value: "—" },
              { label: "Attendance %", value: "—" },
              { label: "Enrolled", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="ss-stat">
                <span className="ss-stat-num">{stat.value}</span>
                <span className="ss-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Two-column placeholder cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="ss-card">
              <div className="ss-card-header">
                <h2>Recent participants</h2>
              </div>
              <p className="ss-meta">
                No participants yet. Add domain entities and API endpoints to
                populate this section.
              </p>
            </section>
            <section className="ss-card">
              <div className="ss-card-header">
                <h2>Recent activity</h2>
              </div>
              <p className="ss-meta">
                Activity feed will appear here once features are built.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
