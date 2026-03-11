import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Sora } from "next/font/google";

import Header from "@/components/Header";
import { authService } from "@/services/authService";

const sora = Sora({ subsets: ["latin"] });

type UserProfile = {
  username: string;
  email: string;
  user_type: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    const userData = authService.getUser();
    if (!userData) {
      router.push("/auth");
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const initials = useMemo(() => {
    if (!user?.username) {
      return "U";
    }

    return user.username
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

  const roleLabel = user?.user_type === "store" ? "Store Owner" : "Customer";
  const accountDescription =
    user?.user_type === "store"
      ? "Manage products, track dashboard activity, and review store performance from one account."
      : "Manage your shopping flow, saved items, and orders from one account.";
  const token = authService.getToken();
  const maskedToken = token ? `${token.slice(0, 8)}...${token.slice(-6)}` : "No active token";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6ef] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#dad6c7] bg-white/90 p-8 text-center shadow-[0_16px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d6ccb2] border-t-[#486f3d]" />
          <p className={`mt-5 text-xl font-semibold text-slate-800 ${sora.className}`}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f4ec] text-slate-900">
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#f4d8a8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-56 h-72 w-72 rounded-full bg-[#b4d2ad]/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#d9e8f3]/35 blur-3xl" />

      <Header />

      <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-[#cfc8b0] bg-gradient-to-br from-[#f5e7cb] via-[#f8f3e7] to-[#dfead8] p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.4)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-2xl font-semibold text-white shadow-lg ${sora.className}`}>
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Profile Overview</p>
                <h1 className={`mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl ${sora.className}`}>
                  {user?.username}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">{accountDescription}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-300/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800">
                {roleLabel}
              </span>
              <span className="rounded-full border border-[#5f834f]/30 bg-[#6d8f56]/15 px-4 py-2 text-sm font-semibold text-[#345026]">
                Logged in
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-[#d8d3c3] bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Account Details</h2>
              <span className="rounded-full bg-[#eef5e8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#486f3d]">
                Active Session
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Username</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user?.username}</p>
              </div>

              <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                <p className="mt-2 break-all text-lg font-semibold text-slate-900">{user?.email}</p>
              </div>

              <div className="rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account Type</p>
                <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{user?.user_type}</p>
              </div>

              
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#d8d3c3] bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur">
              <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Quick Access</h2>
              <div className="mt-5 space-y-3">
                <Link href="/wishlist" className="flex items-center justify-between rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white">
                  <span>Open wishlist</span>
                  <span>{'>'}</span>
                </Link>
                <Link href="/orders" className="flex items-center justify-between rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white">
                  <span>View orders</span>
                  <span>{'>'}</span>
                </Link>
                <Link href={user?.user_type === "store" ? "/dashboard" : "/shop"} className="flex items-center justify-between rounded-2xl border border-[#e6e0cf] bg-[#faf8f2] px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white">
                  <span>{user?.user_type === "store" ? "Go to dashboard" : "Continue shopping"}</span>
                  <span>{'>'}</span>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-[#d8d3c3] bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.45)] backdrop-blur">
              <h2 className={`text-2xl font-semibold text-slate-900 ${sora.className}`}>Account Summary</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-2xl bg-[#faf8f2] px-4 py-3">
                  <span>Status</span>
                  <strong className="text-slate-900">Authenticated</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[#faf8f2] px-4 py-3">
                  <span>Primary Identity</span>
                  <strong className="text-slate-900">{user?.username}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[#faf8f2] px-4 py-3">
                  <span>Contact</span>
                  <strong className="max-w-[14rem] truncate text-slate-900">{user?.email}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}