"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  Drama,
  Target,
  Gamepad2,
  ClipboardList,
  PenLine,
  PieChart,
  Goal,
  Lightbulb,
  CalendarRange,
  UserCheck,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  UserCog,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
      { href: "/programs", label: "Programs", icon: Drama },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/roster", label: "Roster", icon: ClipboardList },
      { href: "/tracker", label: "Weekly Data", icon: PenLine },
      { href: "/planning", label: "Per-Star Planning", icon: Goal },
      { href: "/year-calendar", label: "Year Calendar", icon: CalendarRange },
      { href: "/cohort-rollup", label: "Cohort Roll-Up", icon: PieChart },
      { href: "/games", label: "Games Library", icon: Gamepad2 },
      { href: "/games/develop", label: "To Develop", icon: Lightbulb },
      { href: "/skills", label: "Skills Framework", icon: Target },
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.label, false]))
  );

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  // Admins get a Users management entry in the Admin section.
  const sections: NavSection[] = SECTIONS.map((section) => {
    if (section.label === "Admin" && user?.role === "Admin") {
      return {
        ...section,
        items: [
          { href: "/users", label: "Users", icon: UserCog },
          ...section.items,
        ],
      };
    }
    return section;
  });

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
        <Image
          src="/logo.png"
          alt="The Shining Stars Project"
          width={120}
          height={80}
          style={{ width: "auto", display: "block", mixBlendMode: "multiply" }}
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
        {sections.map((section) => {
          const isOpen = openSections[section.label] ?? false;
          return (
            <div className="ss-nav-section" key={section.label}>
              <button
                type="button"
                className="ss-nav-section-label"
                aria-expanded={isOpen}
                onClick={() => toggleSection(section.label)}
              >
                <span>{section.label}</span>
                <ChevronDown className={`ss-nav-section-chevron${isOpen ? " is-open" : ""}`} />
              </button>
              {isOpen ? (
                <div className="ss-nav-section-items">
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
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="adm-foot">
        <Link
          href="/account"
          title="Account settings"
          style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
        >
          <span className={`ss-avatar ${user?.role === "Admin" ? "admin" : "teacher"} sm`}>
            {user ? initialsOf(user.fullName) : "?"}
          </span>
          <div className="who" style={{ minWidth: 0 }}>
            <span className="nm">{user?.fullName ?? "—"}</span>
            <span className="rl">{user?.role ?? ""}</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          style={{
            marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
            color: "var(--fg-tertiary)", padding: 6, borderRadius: "var(--r-sm)",
            display: "inline-flex", alignItems: "center",
          }}
        >
          <LogOut style={{ width: 16, height: 16 }} />
        </button>
      </div>
      </nav>
    </>
  );
}
