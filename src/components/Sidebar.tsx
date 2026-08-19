"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

const navItems = [
  { href: "/", label: "Notebook", icon: BookOpen },
  { href: "/expenses", label: "Daily Expenses", icon: Receipt },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/monthly", label: "Monthly Summary", icon: BarChart3 },
  { href: "/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/bills", label: "Bills & Subs", icon: FileText },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isConfigured, signInWithGoogle, signOut } = useAuth();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-paper-dark border border-[rgba(0,0,0,0.08)] shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-ink-dark" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-10
          w-64 bg-paper-dark border-r border-[rgba(0,0,0,0.08)]
          flex flex-col transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 text-ink-light hover:text-ink-dark"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="p-5 pb-3 border-b border-[rgba(0,0,0,0.06)]">
          <h1 className="font-handwritten text-3xl text-ink-dark tracking-tight">
            My Expense Diary
          </h1>
          <p className="text-xs text-ink-light mt-1 font-sans">
            Personal Finance Notebook
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                      transition-colors duration-150
                      ${
                        isActive
                          ? "bg-paper-bg text-accent-warm shadow-sm border border-[rgba(0,0,0,0.06)]"
                          : "text-ink-medium hover:bg-paper-bg/60 hover:text-ink-dark"
                      }
                    `}
                  >
                    <item.icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-[rgba(0,0,0,0.06)]">
          {/* Add expense CTA */}
          <div className="p-4 pb-2">
            <Link
              href="/expenses?add=true"
              onClick={(e) => { e.preventDefault(); setMobileOpen(false); requireAuth(() => window.location.href = "/expenses?add=true"); }}
              className="
                flex items-center justify-center gap-2 w-full py-2.5 px-4
                bg-accent-warm text-white rounded-md text-sm font-medium
                hover:opacity-90 transition-opacity shadow-sm
              "
            >
              <Plus size={16} />
              Add Expense
            </Link>
          </div>

          {/* Auth section */}
          {isConfigured && (
          <div className="p-4 pt-2">
            {loading ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-paper-bg animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-20 bg-paper-bg rounded animate-pulse" />
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-warm/10 flex items-center justify-center overflow-hidden shrink-0">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User size={16} className="text-accent-warm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-dark font-medium truncate">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-ink-light truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="p-1.5 text-ink-light hover:text-accent-red transition-colors shrink-0"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-ink-medium hover:text-ink-dark hover:bg-paper-bg rounded transition-colors"
              >
                <LogIn size={16} />
                Sign in
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
