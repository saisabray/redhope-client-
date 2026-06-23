"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { createPortal } from "react-dom";
import {
  Droplets, MapPin, MapPinned, Building2, Home,
  CalendarDays, Clock, MessageSquare, User,
  Mail, AlertTriangle, CheckCircle2, ArrowLeft,
  Heart, Loader2,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const BLOOD_COLORS = {
  "A+": "#f87171", "A-": "#fca5a5",
  "B+": "#fb923c", "B-": "#fdba74",
  "AB+": "#c084fc", "AB-": "#d8b4fe",
  "O+": "#f472b6", "O-": "#f9a8d4",
};

const STATUS_COLORS = {
  pending:    { bg: "bg-amber-400/10",  text: "text-amber-400", border: "border-amber-400/35",  label: "Pending"     },
  inprogress: { bg: "bg-blue-500/10",  text: "text-blue-400", border: "border-blue-500/35",  label: "In Progress" },
  done:       { bg: "bg-green-500/10",   text: "text-green-400", border: "border-green-500/30",    label: "Done"        },
  canceled:   { bg: "bg-red-500/10",   text: "text-red-400", border: "border-red-500/30",    label: "Canceled"    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return d; }
}

// ── Detail Row ────────────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 border-b border-slate-400/[0.07] last:border-0">
      <div 
        className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center border"
        style={{
          background: accent ? `${accent}18` : "rgba(148,163,184,0.08)",
          borderColor: accent ? `${accent}33` : "rgba(148,163,184,0.12)",
        }}
      >
        <Icon size={16} color={accent ?? "#64748b"} />
      </div>
      <div className="flex-1">
        <p className="m-0 mb-[3px] text-[0.7rem] text-slate-500 font-bold tracking-[0.06em] uppercase">
          {label}
        </p>
        <p className="m-0 text-slate-200 text-[0.9rem] font-medium leading-relaxed whitespace-pre-wrap">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ── Donate Modal ──────────────────────────────────────────────────────────────

function DonateModal({ user, onConfirm, onCancel, loading, success }) {
  const modal = (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[linear-gradient(145deg,#0f172a,#111827)] border border-slate-400/10 rounded-[22px] p-[36px_32px] w-full max-w-[460px] shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-[fadeUp_0.2s_ease]">
        {success ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/35 flex items-center justify-center mx-auto mb-4.5 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle2 size={30} className="text-green-400" />
            </div>
            <h3 className="m-0 mb-2.5 text-[1.2rem] font-extrabold text-green-400">
              Thank You! 🩸
            </h3>
            <p className="m-0 mb-6 text-slate-400 text-[0.9rem] leading-relaxed">
              Your donation has been confirmed. The requester will be notified shortly.
            </p>
            <button onClick={onCancel} className="px-7 py-2.5 rounded-[10px] bg-green-500/15 border border-green-500/35 text-green-400 text-[0.875rem] font-bold cursor-pointer transition-colors hover:bg-green-500/25">
              Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6.5">
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/35 flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.15)]">
                <Heart size={22} className="text-red-400" fill="rgba(239,68,68,0.3)" />
              </div>
              <div>
                <h3 className="m-0 text-[1.15rem] font-extrabold text-slate-100">
                  Confirm Your Donation
                </h3>
                <p className="m-0 mt-0.5 text-slate-500 text-[0.8rem]">
                  Your info will be shared with the requester.
                </p>
              </div>
            </div>

            {/* Donor name (read-only) */}
            <div className="mb-3.5">
              <label className="block text-[0.75rem] text-slate-500 font-bold tracking-[0.06em] uppercase mb-[7px]">
                Your Name
              </label>
              <div className="flex items-center gap-2.5 p-[11px_14px] rounded-[10px] bg-slate-900/60 border border-slate-400/10">
                <User size={15} className="text-slate-500" />
                <span className="text-slate-200 text-[0.9rem] font-medium">{user?.name ?? "—"}</span>
                <span className="ml-auto text-[0.68rem] text-slate-500 bg-slate-400/10 rounded-md px-2 py-0.5">read-only</span>
              </div>
            </div>

            {/* Donor email (read-only) */}
            <div className="mb-7">
              <label className="block text-[0.75rem] text-slate-500 font-bold tracking-[0.06em] uppercase mb-[7px]">
                Your Email
              </label>
              <div className="flex items-center gap-2.5 p-[11px_14px] rounded-[10px] bg-slate-900/60 border border-slate-400/10">
                <Mail size={15} className="text-slate-500" />
                <span className="text-slate-200 text-[0.9rem] font-medium">{user?.email ?? "—"}</span>
                <span className="ml-auto text-[0.68rem] text-slate-500 bg-slate-400/10 rounded-md px-2 py-0.5">read-only</span>
              </div>
            </div>

            {/* Notice */}
            <div className="flex gap-2.5 p-[12px_14px] bg-amber-400/10 border border-amber-400/20 rounded-[10px] mb-5.5">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-[2px]" />
              <p className="m-0 text-slate-400 text-[0.8rem] leading-relaxed">
                By confirming, the request status will change to <strong className="text-blue-400">In Progress</strong>. You are committing to donate blood to the recipient.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button onClick={onCancel} disabled={loading} className="flex-1 py-[11px] rounded-[10px] border border-slate-400/20 bg-white/5 text-slate-400 text-[0.875rem] font-semibold cursor-pointer transition-colors hover:bg-white/10 hover:text-slate-300">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading} className={`flex-[2] flex items-center justify-center gap-2 py-[11px] rounded-[10px] border border-red-500/45 bg-red-500/20 text-red-400 text-[0.875rem] font-bold transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-red-500/30'}`}>
                {loading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-[spin_0.7s_linear_infinite]" /> Confirming…</>
                ) : (
                  <><Heart size={15} fill="rgba(239,68,68,0.4)" /> Confirm Donation</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DonationRequestDetailsPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params?.Id;

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = session?.user;

  const [request, setRequest]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Auth guard — redirect to login if not signed in ───────────────────────
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace(`/login?redirect=/donation-requests/${id}`);
    }
  }, [sessionLoading, user, id]);

  // ── Fetch request details ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    fetch(`${BASE_URL}/donation-requests/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => setRequest(data))
      .catch(() => setError("Donation request not found or could not be loaded."))
      .finally(() => setLoading(false));
  }, [id, user]);

  // ── Confirm donation ───────────────────────────────────────────────────────
  const handleConfirmDonate = async () => {
    if (!user || !request) return;
    setConfirming(true);
    try {
      const { data: token } = await authClient.token();
      const res = await fetch(`${BASE_URL}/donation-requests/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token?.token}`
        },
        body: JSON.stringify({
          status: "inprogress",
          donorName:  user.name,
          donorEmail: user.email,
          donorId:    user.id,
        }),
      });
      if (!res.ok) throw new Error();
      setRequest((prev) => ({ ...prev, status: "inprogress", donorName: user.name, donorEmail: user.email }));
      setDonateSuccess(true);
    } catch {
      alert("Failed to confirm donation. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // ── Loading/auth spinner ───────────────────────────────────────────────────
  if (sessionLoading || (!user && !sessionLoading)) {
    return (
      <div className="flex items-center justify-center gap-3 text-slate-400 py-20 min-h-[60vh] bg-[#0a0f1e]">
        <div className="w-6 h-6 border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>Verifying access…</span>
      </div>
    );
  }

  const bloodColor = BLOOD_COLORS[request?.bloodGroup] ?? "#f87171";
  const statusInfo = STATUS_COLORS[request?.status] ?? STATUS_COLORS.pending;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0a0f1e_0%,#0d1526_50%,#0a0f1e_100%)] pt-10 px-5 pb-[60px] font-sans">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Modal */}
      {mounted && showModal && (
        <DonateModal
          user={user}
          loading={confirming}
          success={donateSuccess}
          onConfirm={handleConfirmDonate}
          onCancel={() => { setShowModal(false); setDonateSuccess(false); }}
        />
      )}

      <div className="max-w-[760px] mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 mb-6 px-4 py-2 rounded-[10px] border border-slate-400/15 bg-white/5 text-slate-400 text-[0.83rem] font-semibold cursor-pointer transition-colors duration-150 hover:bg-white/10 hover:text-slate-200"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-3.5 py-20 text-slate-400">
            <div className="w-9 h-9 border-[3px] border-slate-400/15 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
            <span>Loading details…</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-[40px_32px] text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3.5" />
            <h3 className="m-0 mb-2 text-red-400 font-bold">Not Found</h3>
            <p className="m-0 text-slate-400 text-[0.9rem]">{error}</p>
          </div>
        )}

        {/* ── Details ── */}
        {!loading && !error && request && (
          <div className="animate-[fadeUp_0.4s_ease]">

            {/* ── Header Card ── */}
            <div 
              className="bg-slate-900/80 rounded-[20px] overflow-hidden backdrop-blur-md mb-5"
              style={{
                border: `1px solid ${bloodColor}33`,
                boxShadow: `0 0 40px ${bloodColor}15`,
              }}
            >
              {/* Top accent */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${bloodColor}, ${bloodColor}66)` }} />

              <div className="p-[28px_28px_24px]">
                <div className="flex items-start justify-between flex-wrap gap-3.5 mb-2.5">
                  {/* Blood group */}
                  <span 
                    className="rounded-xl px-5 py-2 text-[1.4rem] font-black tracking-[0.04em]"
                    style={{
                      background: `${bloodColor}1a`, color: bloodColor,
                      border: `1px solid ${bloodColor}55`,
                    }}
                  >
                    {request.bloodGroup ?? "—"}
                  </span>

                  {/* Status badge */}
                  <span className={`rounded-full px-4 py-1.5 text-[0.8rem] font-bold tracking-[0.04em] border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h1 className="m-0 mt-3.5 mb-1 text-[1.6rem] font-extrabold text-slate-100 tracking-[-0.02em]">
                  {request.recipientName}
                </h1>
                <p className="m-0 text-slate-500 text-[0.875rem]">
                  Blood donation request · Created {new Date(request.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* ── Details Card ── */}
            <div className="bg-slate-900/75 border border-slate-400/10 rounded-[20px] p-[8px_24px_4px] backdrop-blur-md mb-4">
              <DetailRow icon={MapPin}       label="District"       value={request.recipientDistrict}  accent="#60a5fa" />
              <DetailRow icon={MapPinned}    label="Upazila"        value={request.recipientUpazila}   accent="#60a5fa" />
              <DetailRow icon={Building2}    label="Hospital"       value={request.hospitalName}        accent="#a78bfa" />
              <DetailRow icon={Home}         label="Full Address"   value={request.fullAddress}         accent="#a78bfa" />
              <DetailRow icon={CalendarDays} label="Donation Date"  value={formatDate(request.donationDate)} accent="#fbbf24" />
              <DetailRow icon={Clock}        label="Donation Time"  value={request.donationTime ?? "—"}  accent="#fbbf24" />
            </div>

            {/* ── Requester Card ── */}
            <div className="bg-slate-900/75 border border-slate-400/10 rounded-[20px] p-[8px_24px_4px] backdrop-blur-md mb-4">
              <DetailRow icon={User}  label="Requested By"    value={request.requesterName}  accent="#4ade80" />
              <DetailRow icon={Mail}  label="Requester Email" value={request.requesterEmail} accent="#4ade80" />
            </div>

            {/* ── Message Card ── */}
            {request.requestMessage && (
              <div className="bg-slate-900/75 border border-slate-400/10 rounded-[20px] p-[8px_24px_4px] backdrop-blur-md mb-5">
                <DetailRow icon={MessageSquare} label="Request Message" value={request.requestMessage} accent="#f87171" />
              </div>
            )}

            {/* ── Donor Info (when inprogress) ── */}
            {request.status === "inprogress" && request.donorName && (
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-[20px] p-[8px_24px_4px] backdrop-blur-md mb-5">
                <p className="m-0 mt-3.5 mb-1 text-[0.72rem] text-blue-400 font-bold tracking-[0.08em] uppercase">
                  Donor Information
                </p>
                <DetailRow icon={User} label="Donor Name"  value={request.donorName}  accent="#60a5fa" />
                <DetailRow icon={Mail} label="Donor Email" value={request.donorEmail} accent="#60a5fa" />
              </div>
            )}

            {/* ── Donate Button ── */}
            {request.status === "pending" && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 rounded-[14px] bg-[linear-gradient(135deg,rgba(239,68,68,0.25),rgba(220,38,38,0.18))] border border-red-500/45 text-red-400 text-base font-extrabold cursor-pointer tracking-[0.02em] flex items-center justify-center gap-2.5 transition-all duration-200 shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:bg-[linear-gradient(135deg,rgba(239,68,68,0.35),rgba(220,38,38,0.28))] hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] hover:-translate-y-0.5"
              >
                <Heart size={20} fill="rgba(239,68,68,0.35)" />
                I Want to Donate Blood
              </button>
            )}

            {/* Status messages for non-pending */}
            {request.status !== "pending" && (
              <div className={`p-[16px_20px] rounded-[14px] text-center border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text} text-[0.9rem] font-semibold`}>
                This request is currently <strong>{statusInfo.label}</strong> — no longer accepting donors.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}