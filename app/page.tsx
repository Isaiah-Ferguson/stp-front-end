import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">

        {/* Logo / Brand */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl font-bold shadow-lg">
            S
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            ShinyStar CRM
          </h1>
          <p className="text-lg text-gray-600">
            Customer relationship management, made simple.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition-colors"
          >
            View API Docs
          </a>
        </div>

        {/* Stack Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {[
            { label: "Frontend", value: "Next.js + Tailwind" },
            { label: "Backend", value: "ASP.NET Core" },
            { label: "Database", value: "Azure SQL" },
            { label: "ORM", value: "EF Core" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left"
            >
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
