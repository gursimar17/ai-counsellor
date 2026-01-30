"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/counsellor", label: "AI Counsellor" },
  { href: "/universities", label: "Universities" },
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
];

export default function Nav() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="font-semibold text-teal-700">
          AI Counsellor
        </Link>
        <div className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-slate-600 hover:text-teal-600 text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          <span className="text-slate-500 text-sm">{user.full_name}</span>
          <button
            type="button"
            onClick={logout}
            className="text-slate-500 hover:text-red-600 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
