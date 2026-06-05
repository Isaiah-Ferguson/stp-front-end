import Link from "next/link";

/**
 * Dashboard page — the main entry point after login.
 * Add CRM feature cards/sections here as the project grows.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <span className="text-lg font-semibold text-gray-900">ShinyStar CRM</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
          >
            API Docs
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Welcome to ShinyStar CRM. Your workspace is ready.
          </p>
        </div>

        {/* Placeholder Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Contacts", value: "—", color: "bg-indigo-50 text-indigo-700" },
            { label: "Active Deals", value: "—", color: "bg-emerald-50 text-emerald-700" },
            { label: "Open Tasks", value: "—", color: "bg-amber-50 text-amber-700" },
            { label: "This Month Revenue", value: "—", color: "bg-sky-50 text-sky-700" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-2"
            >
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color} inline-block px-2 py-0.5 rounded-md`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Contacts</h2>
            <p className="text-sm text-gray-400 italic">
              No contacts yet. Add domain entities and API endpoints to populate this section.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <p className="text-sm text-gray-400 italic">
              Activity feed will appear here once features are built.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
