"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Receipt,
  Calendar,
  BarChart3,
  RefreshCw,
  FileText,
  LineChart,
  StickyNote,
  Settings,
  Plus,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

const AVATARS: Record<string, string> = Object.fromEntries(
  Array.from({ length: 11 }, (_, i) => [`av-${i + 1}`, `/profiles/${i + 1}.png`])
);

function getAvatarUrl(avatarId: string): string {
  return AVATARS[avatarId] || "";
}

const navSections = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Notebook", icon: BookOpen },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/monthly", label: "Monthly Summary", icon: BarChart3 },
      { href: "/recurring", label: "Recurring", icon: RefreshCw },
      { href: "/bills", label: "Bills & Subs", icon: FileText },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/insights", label: "Insights", icon: LineChart },
      { href: "/notes", label: "Notes", icon: StickyNote },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, loading, isConfigured, signOut } = useAuth();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-paper-dark/80 backdrop-blur border border-[rgba(0,0,0,0.08)] shadow-md hover:shadow-lg transition-shadow"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-ink-dark" />
      </button>

      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-10
          bg-paper-dark/95 backdrop-blur-md border-r border-[rgba(0,0,0,0.06)]
          flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${collapsed ? "w-[72px]" : "w-64"}
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"}
        `}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-ink-light hover:text-ink-dark hover:bg-paper-bg/60 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className={`px-4 pt-5 pb-4 border-b border-[rgba(0,0,0,0.06)] ${collapsed ? "px-3" : ""}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/logo/org-logo.png" alt="Logo" className="w-7 h-7 rounded-md" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-handwritten text-xl text-ink-dark tracking-tight leading-tight truncate">
                  My Expense Diary
                </h1>
                <p className="text-[10px] text-ink-light mt-0.5 font-sans truncate tracking-wide uppercase">
                  Finance Tracker
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-24 z-20 w-7 h-7 rounded-full bg-paper-dark border border-[rgba(0,0,0,0.1)] items-center justify-center text-ink-light hover:text-accent-warm hover:border-accent-warm/50 hover:bg-accent-warm/5 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={section.label} className={sIdx > 0 ? "mt-5" : ""}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-light/60">
                  {section.label}
                </p>
              )}
              {collapsed && sIdx > 0 && (
                <div className="mx-auto mb-1.5 w-5 h-px bg-[rgba(0,0,0,0.08)]" />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        onMouseEnter={() => collapsed && setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`
                          group relative flex items-center rounded-xl text-sm font-medium
                          transition-all duration-200
                          ${collapsed ? "justify-center w-12 h-11 mx-auto" : "gap-3 px-3 py-2.5"}
                          ${
                            isActive
                              ? "bg-gradient-to-r from-accent-warm/10 to-accent-warm/5 text-accent-warm shadow-sm"
                              : "text-ink-medium hover:bg-paper-bg/70 hover:text-ink-dark hover:shadow-sm active:scale-[0.98]"
                          }
                        `}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-warm" />
                        )}

                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.7}
                          className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                        />

                        {!collapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}

                        {/* Active dot */}
                        {isActive && !collapsed && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-warm/60 shrink-0" />
                        )}
                      </Link>

                      {/* Collapsed tooltip */}
                      {collapsed && hoveredItem === item.href && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-ink-dark text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-left-1">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ink-dark" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[rgba(0,0,0,0.06)] pt-3 pb-4 space-y-2">
          {/* Add expense CTA */}
          <div className={`px-3 ${collapsed ? "px-2" : ""}`}>
            <Link
              href="/expenses?add=true"
              onClick={(e) => { e.preventDefault(); setMobileOpen(false); requireAuth(() => window.location.href = "/expenses?add=true"); }}
              title={collapsed ? "Add Expense" : undefined}
              onMouseEnter={() => collapsed && setHoveredItem("add")}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                relative flex items-center justify-center gap-2 w-full py-2.5
                bg-gradient-to-r from-accent-warm to-accent-warm/90 text-white
                rounded-xl text-sm font-medium shadow-md
                hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-200
                ${collapsed ? "w-12 h-11 mx-auto" : "px-4"}
              `}
            >
              <Plus size={17} strokeWidth={2.2} />
              {!collapsed && <span>Add Expense</span>}

              {collapsed && hoveredItem === "add" && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-ink-dark text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                  Add Expense
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ink-dark" />
                </div>
              )}
            </Link>
          </div>

          {/* Auth section */}
          {isConfigured && (
            <div className={`px-3 ${collapsed ? "px-2" : ""}`}>
              {loading ? (
                <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-paper-bg animate-pulse shrink-0" />
                  {!collapsed && (
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 bg-paper-bg rounded animate-pulse" />
                      <div className="h-2.5 w-28 bg-paper-bg rounded animate-pulse" />
                    </div>
                  )}
                </div>
              ) : user ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 p-2 rounded-xl hover:bg-paper-bg/50 transition-colors ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? (user.user_metadata?.full_name || user.email) : undefined}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-paper-dark shadow-sm">
                    {user.user_metadata?.avatar_id && getAvatarUrl(user.user_metadata.avatar_id) ? (
                      <img
                        src={getAvatarUrl(user.user_metadata.avatar_id)}
                        alt=""
                        className="w-9 h-9 rounded-full"
                      />
                    ) : user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        className="w-9 h-9 rounded-full"
                      />
                    ) : (
                      <User size={16} className="text-accent-warm" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-dark font-semibold truncate">
                          {user.user_metadata?.full_name || user.email?.split("@")[0]}
                        </p>
                        <p className="text-[10px] text-ink-light truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); signOut(); setMobileOpen(false); }}
                        className="p-2 text-ink-light hover:text-accent-red hover:bg-accent-red/5 rounded-lg transition-colors shrink-0"
                        title="Sign out"
                      >
                        <LogOut size={14} />
                      </button>
                    </>
                  )}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? "Sign in" : undefined}
                  onMouseEnter={() => collapsed && setHoveredItem("signin")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    relative flex items-center gap-2 py-2.5 text-sm text-ink-medium
                    hover:text-ink-dark hover:bg-paper-bg/60 rounded-xl transition-all duration-200
                    ${collapsed ? "justify-center w-12 mx-auto" : "px-3"}
                  `}
                >
                  <LogIn size={17} />
                  {!collapsed && "Sign in"}

                  {collapsed && hoveredItem === "signin" && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-ink-dark text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                      Sign in
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ink-dark" />
                    </div>
                  )}
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="adding expenses" />
    </>
  );
}
