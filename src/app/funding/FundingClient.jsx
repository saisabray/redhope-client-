"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Heart, CreditCard, CalendarDays, User, ArrowRight, Activity, DollarSign } from "lucide-react";

export default function FundingClient({ initialFundings = [] }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/funding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          userId: user?.id || null,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to initiate payment.");
        setLoading(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 bg-[#030712] text-slate-200 font-sans selection:bg-rose-500/30">
      {/* Subtle Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1060px] mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-500/10 text-rose-500 mb-6 ring-1 ring-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <Heart size={26} className="fill-rose-500/20" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Support Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-600">Mission</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Your generous contributions empower us to make a real difference. Give today and help us bring hope to those in need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Donation Form Card */}
          <div className="lg:col-span-5 relative group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ease-out">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl" />
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-8">
                <CreditCard className="text-rose-400" size={22} />
                Make a Donation
              </h2>
              
              <form onSubmit={handleDonate} className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                    Donation Amount
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg transition-colors group-focus-within/input:text-rose-400">
                      $
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50"
                      className="w-full pl-10 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-xl font-bold text-white focus:outline-none focus:border-rose-500/50 focus:ring-[4px] focus:ring-rose-500/10 transition-all placeholder:text-slate-600 shadow-inner"
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
                    <Activity size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`group w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] tracking-wide transition-all duration-300 ${
                    loading 
                      ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_8px_30px_rgba(225,29,72,0.3)] hover:shadow-[0_8px_40px_rgba(225,29,72,0.4)] hover:-translate-y-1"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Activity className="animate-spin" size={18} /> Processing securely...
                    </span>
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
                
                <p className="text-[13px] text-center text-slate-500 font-medium">
                  Payments are securely processed by Stripe.
                </p>
              </form>
            </div>
          </div>

          {/* Funding Table Card */}
          <div className="lg:col-span-7 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col h-full">
              <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1.5">Recent Contributions</h2>
                  <p className="text-[14px] text-slate-400 font-medium">A heartfelt thank you to our generous donors.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center">
                  <Heart className="text-rose-400" size={20} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="py-5 px-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest">Donor</th>
                      <th className="py-5 px-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                      <th className="py-5 px-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {initialFundings.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-16 text-center text-slate-500 font-medium">
                          No funding records found yet. Be the first to donate!
                        </td>
                      </tr>
                    ) : (
                      initialFundings.map((fund, idx) => (
                        <tr 
                          key={fund._id || idx}
                          className="hover:bg-white/[0.03] transition-colors duration-200 group"
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <User size={16} className="text-slate-300" />
                              </div>
                              <span className="font-semibold text-slate-200 text-[15px]">
                                {fund.userName || "Anonymous Donor"}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[14px]">
                              <DollarSign size={14} />
                              {fund.amount}
                            </div>
                          </td>
                          <td className="py-5 px-8 text-right text-[14px] text-slate-400 font-medium">
                            <div className="flex items-center justify-end gap-2.5">
                              <CalendarDays size={14} className="text-slate-500" />
                              <span>
                                {mounted && fund.createdAt 
                                  ? new Date(fund.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : (mounted ? "N/A" : "")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
