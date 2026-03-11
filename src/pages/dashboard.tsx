import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import ChartPlaceholder from "@/components/ChartPlaceholder";
import { authService } from "@/services/authService";
import Sidebar from "@/components/Sidebar";


interface User {
  username: string;
  email: string;
  user_type: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const highlights = [
    { label: "Revenue Pulse", value: "$12.8K", tone: "text-emerald-300" },
    { label: "Orders Today", value: "84", tone: "text-sky-300" },
    { label: "Returning Buyers", value: "38%", tone: "text-orange-300" },
  ];

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    const userData = authService.getUser();
    // ensure only store users see this page
    if (!userData || userData.user_type !== "store") {
      router.push("/");
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07131f]">
        <div className="dashboard-ui rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center text-white shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          <p className="text-lg font-semibold tracking-wide">Preparing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="dashboard-ui relative min-h-screen overflow-hidden bg-[#081625] text-slate-100">
        <div className="mesh-orb absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f97316]/40" />
        <div className="mesh-orb delay absolute right-8 top-10 h-64 w-64 rounded-full bg-[#14b8a6]/30" />
        <div className="mesh-orb absolute bottom-10 right-1/3 h-56 w-56 rounded-full bg-[#facc15]/25" />

        <div className="relative flex min-h-screen flex-col md:flex-row">
          <div className="shrink-0 md:sticky md:top-0 md:h-screen">
            <Sidebar onLogout={handleLogout} />
          </div>

          <main className="flex-1 overflow-y-auto max-h-screen p-4 md:p-8 lg:p-10">
            <section className="reveal mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-teal-950/60 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-sm md:p-8">
              <div className="flex flex-col gap-5">
                <p className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
                  Control Center
                </p>
                <h1 className="dashboard-title text-4xl leading-tight text-[#fff9ef] md:text-5xl">
                  Store Dashboard Snapshot
                </h1>
                <p className="max-w-2xl text-sm text-slate-200/90 md:text-base">
                  Welcome back{user?.username ? `, ${user.username}` : ""}. Track momentum, compare trends, and monitor daily progress in one focused view.
                </p>
              </div>
            </section>

            <section className="reveal mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
                </article>
              ))}
            </section>

            <section className="space-y-6">
              <div className="reveal">
                <ChartPlaceholder
                  title="Monthly Results"
                  subtitle="Overview: Jan to Jul"
                  className="min-h-[18rem]"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="reveal">
                  <ChartPlaceholder title="Trend" subtitle="Customer growth" className="min-h-[16rem]" />
                </div>
                <div className="reveal">
                  <ChartPlaceholder title="Progress" subtitle="Campaign performance" className="min-h-[16rem]" />
                </div>
              </div>
            </section>
          </main>
        </div>

        <style jsx>{`
          .dashboard-ui {
            font-family: "Sora", "Trebuchet MS", sans-serif;
          }

          .dashboard-title {
            font-family: "DM Serif Display", Georgia, serif;
            letter-spacing: 0.01em;
          }

          .mesh-orb {
            filter: blur(36px);
            animation: float 9s ease-in-out infinite;
            pointer-events: none;
          }

          .mesh-orb.delay {
            animation-delay: -4.5s;
          }

          .reveal {
            animation: rise 0.5s ease both;
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes rise {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}
