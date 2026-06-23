"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Droplets, MapPin, CalendarDays, Clock, Eye,
  Search, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const ROWS_PER_PAGE = 9; // 3×3 card grid

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_COLORS = {
  "A+": "#f87171", "A-": "#fca5a5",
  "B+": "#fb923c", "B-": "#fdba74",
  "AB+": "#c084fc", "AB-": "#d8b4fe",
  "O+": "#f472b6", "O-": "#f9a8d4",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getId = (r) =>
  typeof r._id === "object" && r._id !== null
    ? (r._id.$oid ?? String(r._id))
    : String(r._id ?? "");

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
}

// ── Card Component ────────────────────────────────────────────────────────────

function RequestCard({ req, onView }) {
  const bloodColor = BLOOD_COLORS[req.bloodGroup] ?? "#f87171";

  return (
    <div
      className="group relative flex flex-col gap-3.5 p-[24px_22px] rounded-[18px] bg-slate-900/75 border border-slate-400/10 backdrop-blur-md overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-[3px]"
      style={{
        "--hover-bg": "rgba(20,30,55,0.95)",
        "--hover-border": `${bloodColor}55`,
        "--hover-shadow": "0 8px 32px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = e.currentTarget.style.getPropertyValue('--hover-bg');
        e.currentTarget.style.borderColor = e.currentTarget.style.getPropertyValue('--hover-border');
        e.currentTarget.style.boxShadow = e.currentTarget.style.getPropertyValue('--hover-shadow');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(15,23,42,0.75)";
        e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[18px]" 
        style={{ background: `linear-gradient(90deg, ${bloodColor}, ${bloodColor}88)` }} 
      />

      {/* Blood group badge */}
      <div className="flex items-center justify-between">
        <span 
          className="px-3.5 py-[5px] rounded-[10px] text-base font-black tracking-[0.04em]"
          style={{ background: `${bloodColor}1a`, color: bloodColor, border: `1px solid ${bloodColor}55` }}
        >
          {req.bloodGroup ?? "—"}
        </span>
        <span className="px-2.5 py-[3px] rounded-full text-[0.68rem] font-bold tracking-[0.06em] uppercase bg-amber-400/10 text-amber-400 border border-amber-400/30">
          Pending
        </span>
      </div>

      {/* Recipient Name */}
      <div>
        <p className="m-0 mb-[3px] text-[0.68rem] font-semibold text-slate-500 tracking-[0.06em] uppercase">
          Recipient
        </p>
        <p className="m-0 text-base font-bold text-slate-100 leading-[1.3]">
          {req.recipientName ?? "—"}
        </p>
      </div>

      {/* Location */}
      <div className="flex items-start gap-[7px]">
        <MapPin size={14} className="text-slate-500 mt-[2px] shrink-0" />
        <div>
          <p className="m-0 mb-[2px] text-[0.68rem] font-semibold text-slate-500 tracking-[0.06em] uppercase">
            Location
          </p>
          <p className="m-0 text-[0.875rem] text-slate-400">
            {[req.recipientDistrict, req.recipientUpazila].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={14} className="text-slate-500" />
          <span className="text-[0.82rem] text-slate-400">{formatDate(req.donationDate)}</span>
        </div>
        {req.donationTime && (
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            <span className="text-[0.82rem] text-slate-400">{req.donationTime}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-400/10" />

      {/* View Button */}
      <button
        onClick={() => onView(getId(req))}
        className="flex items-center justify-center gap-[7px] w-full py-2.5 rounded-[10px] text-[0.875rem] font-bold tracking-[0.02em] cursor-pointer transition-all duration-200 border bg-white/5 border-slate-400/15 text-slate-400 group-hover:bg-opacity-10"
        style={{
          "--btn-hover-bg": `${bloodColor}22`,
          "--btn-hover-border": `${bloodColor}55`,
          "--btn-hover-color": bloodColor,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = e.currentTarget.style.getPropertyValue('--btn-hover-bg');
          e.currentTarget.style.borderColor = e.currentTarget.style.getPropertyValue('--btn-hover-border');
          e.currentTarget.style.color = e.currentTarget.style.getPropertyValue('--btn-hover-color');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)";
          e.currentTarget.style.color = "#94a3b8";
        }}
      >
        <Eye size={15} /> View Details
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DonationRequestsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [bloodFilter, setBloodFilter] = useState("all");
  const [page, setPage]         = useState(1);

  // Fetch all pending requests
  useEffect(() => {
    fetch(`${BASE_URL}/donation-requests`)
      .then((r) => r.json())
      .then((data) => {
        const pending = Array.isArray(data) ? data.filter((r) => r.status === "pending") : [];
        setRequests(pending);
      })
      .catch(() => setError("Failed to load donation requests."))
      .finally(() => setLoading(false));
  }, []);

  // Handle view — redirect to login if not authenticated
  const handleView = (id) => {
    if (!session?.user) {
      router.push(`/login?redirect=/donation-requests/${id}`);
    } else {
      router.push(`/donation-requests/${id}`);
    }
  };

  // Filter
  const filtered = useMemo(() => {
    let list = requests;
    if (bloodFilter !== "all") list = list.filter((r) => r.bloodGroup === bloodFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        (r.recipientName ?? "").toLowerCase().includes(q) ||
        (r.recipientDistrict ?? "").toLowerCase().includes(q) ||
        (r.recipientUpazila ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, bloodFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleFilter = (val) => { setBloodFilter(val); setPage(1); };
  const handleSearch = (val) => { setSearch(val); setPage(1); };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0a0f1e_0%,#0d1526_50%,#0a0f1e_100%)] pt-12 px-5 pb-[60px] font-sans text-slate-100">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="max-w-[1100px] mx-auto">

        {/* ── Page Header ── */}
        <div className="text-center mb-10 animate-[fadeUp_0.4s_ease]">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-full px-[18px] py-1.5 mb-[18px]">
            <Droplets size={14} className="text-red-400" />
            <span className="text-red-400 text-[0.78rem] font-bold tracking-[0.06em] uppercase">
              Blood Donation Requests
            </span>
          </div>
          <h1 className="m-0 mb-3 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-slate-100 tracking-[0.03em] leading-[1.2]">
            Help Save a Life Today
          </h1>
          <p className="m-0 text-slate-500 text-base max-w-[520px] mx-auto leading-relaxed">
            Browse all active blood donation requests. Click "View Details" to learn more and reach out to help.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-3 flex-wrap items-center mb-7 animate-[fadeUp_0.4s_ease_0.1s_both]">
          {/* Search */}
          <div className="relative flex-[1_1_240px]">
            <Search size={15} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or location…"
              className="w-full p-[10px_14px_10px_38px] bg-slate-900/80 border border-slate-400/15 rounded-[10px] text-slate-100 text-[0.875rem] outline-none font-inherit placeholder:text-slate-500 focus:border-red-500/50 transition-colors"
            />
          </div>

          {/* Blood group filter */}
          <div className="flex items-center gap-[7px] flex-wrap">
            <Filter size={13} className="text-slate-500" />
            <button
              onClick={() => handleFilter("all")}
              className={`px-3.5 py-[7px] rounded-lg text-[0.8rem] font-bold cursor-pointer border transition-colors ${bloodFilter === "all" ? 'border-red-500/50 bg-red-500/15 text-red-400' : 'border-slate-400/15 bg-white/5 text-slate-500'}`}
            >All</button>
            {BLOOD_GROUPS.map((bg) => {
              const c = BLOOD_COLORS[bg];
              const active = bloodFilter === bg;
              return (
                <button key={bg} onClick={() => handleFilter(bg)}
                  className="px-3 py-[7px] rounded-lg text-[0.8rem] font-bold cursor-pointer border transition-colors"
                  style={{
                    border: active ? `1px solid ${c}66` : "1px solid rgba(148,163,184,0.15)",
                    background: active ? `${c}1a` : "rgba(255,255,255,0.03)",
                    color: active ? c : "#94a3b8",
                  }}
                >{bg}</button>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        {!loading && !error && (
          <p className="text-slate-500 text-[0.82rem] mb-5 animate-[fadeUp_0.4s_ease_0.15s_both]">
            Showing <strong className="text-slate-200">{filtered.length}</strong> pending request{filtered.length !== 1 ? "s" : ""}
            {bloodFilter !== "all" ? ` · Blood group: ${bloodFilter}` : ""}
            {search ? ` · "${search}"` : ""}
          </p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
            <div className="w-10 h-10 border-[3px] border-slate-400/15 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
            <span className="text-[0.95rem]">Loading donation requests…</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="text-center py-15 text-red-400 text-[0.95rem]">
            ⚠ {error}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 px-5">
            <div className="w-15 h-15 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4.5">
              <Droplets size={26} className="text-red-500/50" />
            </div>
            <h3 className="m-0 mb-2 text-slate-100 font-bold">No Requests Found</h3>
            <p className="m-0 text-slate-500 text-[0.875rem]">
              {bloodFilter !== "all" || search
                ? "Try adjusting your filters."
                : "There are no pending donation requests at the moment."}
            </p>
          </div>
        )}

        {/* ── Card Grid ── */}
        {!loading && !error && pageItems.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 animate-[fadeUp_0.4s_ease_0.2s_both]">
            {pageItems.map((req) => (
              <RequestCard key={getId(req)} req={req} onView={handleView} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-9 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={`px-3 py-[7px] rounded-lg border border-slate-400/15 bg-transparent ${safePage === 1 ? 'text-slate-400/30 cursor-not-allowed' : 'text-slate-500 cursor-pointer'}`}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const active = p === safePage;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-[0.85rem] font-medium cursor-pointer border transition-colors ${active ? 'border-red-500/50 bg-red-500/15 text-red-400 font-bold' : 'border-slate-400/10 bg-transparent text-slate-500'}`}
                >{p}</button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={`px-3 py-[7px] rounded-lg border border-slate-400/15 bg-transparent ${safePage === totalPages ? 'text-slate-400/30 cursor-not-allowed' : 'text-slate-500 cursor-pointer'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}