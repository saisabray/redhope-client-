"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Heart, CreditCard, CalendarDays, User, ArrowRight, Activity, DollarSign } from "lucide-react";

export default function FundingClient({ initialFundings = [] }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen py-16 px-6 bg-[linear-gradient(135deg,#0a0f1e_0%,#0d1526_50%,#0a0f1e_100%)] text-slate-200">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
            <Heart className="text-red-500" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 mb-4">
            Support Our Cause
          </h1>
          <p className="text-lg text-slate-400 max-w-[600px] mx-auto leading-relaxed">
            Your generous contributions empower us to make a real difference. Give a fund today and help us bring hope to those in need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          {/* Donation Form Card */}
          <div className="bg-slate-900/60 border border-slate-400/10 rounded-[24px] p-8 backdrop-blur-xl shadow-2xl h-fit sticky top-24">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
              <CreditCard className="text-red-400" size={20} />
              Make a Donation
            </h2>
            
            <form onSubmit={handleDonate} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Amount (USD)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    $
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
                    className="w-full pl-8 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-slate-600"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`group w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  loading 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Activity className="animate-spin" size={20} /> Processing...
                  </span>
                ) : (
                  <>
                    Give Fund <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-slate-500 mt-2">
                Secure payment processing by Stripe.
              </p>
            </form>
          </div>

          {/* Funding Table Card */}
          <div className="bg-slate-900/60 border border-slate-400/10 rounded-[24px] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-400/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Recent Contributions</h2>
                <p className="text-sm text-slate-400">A heartfelt thank you to our recent donors.</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Heart className="text-rose-400 fill-rose-400/20" size={20} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-400/10">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Donor</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400/5">
                  {initialFundings.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-slate-500">
                        No funding records found yet. Be the first to donate!
                      </td>
                    </tr>
                  ) : (
                    initialFundings.map((fund, idx) => (
                      <tr 
                        key={fund._id || idx}
                        className="hover:bg-slate-800/30 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                              <User size={16} className="text-indigo-300" />
                            </div>
                            <span className="font-medium text-slate-200">
                              {fund.userName || "Anonymous Donor"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                            <DollarSign size={14} />
                            {fund.amount}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-sm text-slate-400">
                          <div className="flex items-center justify-end gap-2">
                            <CalendarDays size={14} className="text-slate-500" />
                            {fund.createdAt 
                              ? new Date(fund.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : "N/A"}
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
  );
}
