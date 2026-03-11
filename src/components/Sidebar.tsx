import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { authService } from "@/services/authService";

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const user = authService.getUser();
  const router = useRouter();
  const [showNav, setShowNav] = useState(true);

  const linkBaseClass =
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";
  const linkActiveClass = "bg-[#14b8a6] text-slate-950 shadow-md";
  const linkInactiveClass =
    "border border-transparent bg-transparent text-slate-200 hover:border-white/20 hover:bg-white/10";

  return (
    <aside className="w-full border-b border-white/10 bg-[#081a2b]/90 text-white backdrop-blur md:h-screen md:w-72 md:border-b-0 md:border-r md:border-white/10">
      <div className="flex items-center justify-between px-4 py-5 md:px-5 md:pt-7">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-teal-200/90">Store Panel</p>
          <h2 className="mt-1 text-lg font-semibold text-[#fff7eb] md:text-xl">Merchant Console</h2>
        </div>

        <button
          onClick={() => setShowNav((prev) => !prev)}
          className="rounded-lg border border-white/20 p-2 text-white transition hover:border-white/40 md:hidden"
          aria-label="Toggle navigation"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {showNav && (
        <div className="flex flex-col gap-6 px-4 pb-5 md:h-[calc(100vh-96px)] md:px-5">
          {user && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f97316]/20 text-sm font-bold text-orange-200">
                {user.username?.slice(0, 1).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-white">{user.username}</p>
              <p className="mt-1 break-all text-xs text-slate-300">{user.email}</p>
            </div>
          )}

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className={`${linkBaseClass} ${
                router.pathname === "/dashboard" ? linkActiveClass : linkInactiveClass
              }`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 01.894.553l6 12a1 1 0 01-.447 1.342l-6 3a1 1 0 01-.894 0l-6-3a1 1 0 01-.447-1.342l6-12A1 1 0 0110 2z" />
                </svg>
              </span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/products"
              className={`${linkBaseClass} ${
                router.pathname === "/products" ? linkActiveClass : linkInactiveClass
              }`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="4" width="18" height="4" rx="1" />
                  <rect x="3" y="10" width="18" height="4" rx="1" />
                  <rect x="3" y="16" width="18" height="4" rx="1" />
                </svg>
              </span>
              <span>All Products</span>
            </Link>
          </nav>

          <div className="mt-auto">
            <button
              onClick={onLogout}
              className="w-full rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#fb8b33]"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
