import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl text-center flex flex-col items-center gap-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="ss-avatar lg admin" aria-hidden="true">
            SS
          </div>
          <h1>Shining Stars CRM</h1>
          <p className="ss-meta max-w-md">
            Professional, warm, and accessible. The internal workspace for staff,
            teachers, and program coordinators.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="ss-btn ss-btn-primary">
            Go to dashboard
          </Link>
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="ss-btn"
          >
            View API docs
          </a>
        </div>

        {/* Program palette preview */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="ss-program mjc">MJC</span>
          <span className="ss-program pathways">Pathways</span>
          <span className="ss-program manteca">Manteca PT</span>
          <span className="ss-program productions">Productions</span>
          <span className="ss-program staff">Staff</span>
        </div>

        {/* Stack Info */}
        <div className="ss-statgrid w-full text-left">
          {[
            { label: "Frontend", value: "Next.js + Tailwind" },
            { label: "Backend", value: "ASP.NET Core" },
            { label: "Architecture", value: "Clean Architecture" },
          ].map((item) => (
            <div key={item.label} className="ss-stat">
              <span className="ss-stat-label">{item.label}</span>
              <span className="ss-stat-num text-h3">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
