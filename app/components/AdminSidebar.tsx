"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  UserCheck,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  dot?: "mjc" | "pathways" | "manteca";
  badge?: { text: string; tone: "is-danger" | "is-warning" };
};

type NavSection = { label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        href: "/students",
        label: "Students",
        icon: Users,
        badge: { text: "3", tone: "is-danger" },
      },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Programs",
    items: [
      { href: "/programs/mjc", label: "MJC", dot: "mjc" },
      { href: "/programs/pathways", label: "Pathways", dot: "pathways" },
      { href: "/programs/manteca", label: "Manteca PT", dot: "manteca" },
    ],
  },
  {
    label: "Staff",
    items: [
      {
        href: "/staff",
        label: "Onboarding",
        icon: UserCheck,
        badge: { text: "2", tone: "is-warning" },
      },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/documents", label: "Scripts", icon: BookOpen },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll while the drawer is open on mobile.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="adm-menu-btn"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <div
        className={`adm-sidebar-overlay${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <nav className={`ss-sidebar adm-sidebar${open ? " is-open" : ""}`}>
      <div className="adm-logo" style={{ alignItems: "center", padding: "12px 12px 8px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="The Shining Stars Project"
          style={{ height: 80, width: "auto", display: "block", mixBlendMode: "multiply" }}
        />
        <div style={{
          fontSize: "var(--fs-label)",
          letterSpacing: "var(--ls-label)",
          textTransform: "uppercase",
          color: "var(--fg-secondary)",
          marginTop: 6,
        }}>
          Admin portal
        </div>
      </div>

      <div className="adm-nav">
        {SECTIONS.map((section) => (
          <div className="ss-nav-section" key={section.label}>
            <div className="ss-nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const base = item.href.split("?")[0];
              const isActive = pathname === base;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`ss-nav-item${isActive ? " is-active" : ""}`}
                >
                  {Icon ? <Icon className="ss-nav-icon" /> : null}
                  {item.dot ? (
                    <span className={`ss-dot ${item.dot}`} style={{ margin: "0 1px" }} />
                  ) : null}
                  <span className="ss-nav-label">{item.label}</span>
                  {item.badge ? (
                    <span className={`ss-nav-badge ${item.badge.tone}`}>
                      {item.badge.text}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="adm-foot">
        <span className="ss-avatar admin sm">JD</span>
        <div className="who">
          <span className="nm">Jamie D.</span>
          <span className="rl">Admin</span>
        </div>
      </div>
      </nav>
    </>
  );
}
