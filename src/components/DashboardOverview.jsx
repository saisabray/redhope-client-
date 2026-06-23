"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Sparkles, Users, DollarSign, Activity } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function DashboardOverview({ roleLabel }) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [stats, setStats] = useState({
    totalDonors: 0,
    totalFunding: 0,
    totalRequests: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: token } = await authClient.token();
        const res = await fetch(`${BASE_URL}/admin/stats`, {
          headers: {
            "Authorization": `Bearer ${token?.token}`
          }
        });
        const data = await res.json();
        setStats({
          totalDonors: data.totalDonors || 0,
          totalFunding: data.totalFunding || 0,
          totalRequests: data.totalRequests || 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (isPending) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-[60px] px-6">
        <div className="w-[22px] h-[22px] border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="pt-1 pb-10 text-slate-100 min-h-full">
      <style>{`
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Welcome Section ─────────────────────────────────────────────────── */}
      <div className="max-w-[1000px] mx-auto mb-8 bg-[linear-gradient(135deg,rgba(239,68,68,0.12)_0%,rgba(15,23,42,0.6)_60%)] border border-red-500/20 rounded-[20px] p-8 backdrop-blur-[14px] animate-[fadeUp_0.4s_ease] relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(239,68,68,0.15),transparent_70%)] rounded-full pointer-events-none" />

        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center border-[3px] border-red-500/40 shadow-[0_0_24px_rgba(239,68,68,0.2)] shrink-0 overflow-hidden"
               style={{ background: user?.image ? "transparent" : `hsl(${(user?.name ?? "U").charCodeAt(0) * 13 % 360}, 55%, 38%)` }}>
            {user?.image
              ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-white text-3xl font-bold">
                  {(user?.name ?? "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-amber-400" />
              <span suppressHydrationWarning className="text-[0.85rem] text-amber-400 font-semibold tracking-[0.04em]">
                {greeting}
              </span>
            </div>
            <h1 className="m-0 text-[2rem] font-extrabold text-slate-100 tracking-[-0.03em] leading-[1.2]">
              {user?.name ?? "User"} 👋
            </h1>
            <p className="m-0 mt-1.5 text-slate-400 text-[0.95rem] leading-relaxed">
              Welcome to your {roleLabel} dashboard. Here is an overview of the platform's statistics.
            </p>
          </div>
        </div>
      </div>

      {/* ── Statistics Cards ─────────────────────────────────────────────────── */}
      <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-[fadeUp_0.5s_ease_0.1s_both]">
        
        {/* Card 1: Total Donors */}
        <div className="bg-slate-900/60 border border-slate-400/10 rounded-[20px] p-6 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300 shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Users size={22} className="text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Donors</p>
            <div className="text-4xl font-extrabold text-white flex items-baseline gap-2">
              {loadingStats ? <span className="animate-pulse bg-slate-700 h-8 w-16 rounded"></span> : stats.totalDonors}
            </div>
          </div>
        </div>

        {/* Card 2: Total Funding */}
        <div className="bg-slate-900/60 border border-slate-400/10 rounded-[20px] p-6 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-300 shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign size={22} className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Funding</p>
            <div className="text-4xl font-extrabold text-white flex items-baseline gap-2">
              <span className="text-emerald-400 text-2xl">$</span>
              {loadingStats ? <span className="animate-pulse bg-slate-700 h-8 w-24 rounded"></span> : stats.totalFunding}
            </div>
          </div>
        </div>

        {/* Card 3: Total Blood Requests */}
        <div className="bg-slate-900/60 border border-slate-400/10 rounded-[20px] p-6 backdrop-blur-md relative overflow-hidden group hover:border-red-500/30 transition-colors duration-300 shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Activity size={22} className="text-red-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Blood Requests</p>
            <div className="text-4xl font-extrabold text-white flex items-baseline gap-2">
              {loadingStats ? <span className="animate-pulse bg-slate-700 h-8 w-16 rounded"></span> : stats.totalRequests}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
