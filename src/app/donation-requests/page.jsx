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
  const [hovered, setHovered] = useState(false);
  const bloodColor = BLOOD_COLORS[req.bloodGroup] ?? "#f87171";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(20,30,55,0.95)"
          : "rgba(15,23,42,0.75)",
        border: hovered
          ? `1px solid ${bloodColor}55`
          : "1px solid rgba(148,163,184,0.1)",
        borderRadius: 18,
        padding: "24px 22px",
        backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column", gap: 14,
        transition: "all 0.22s ease",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4)` : "none",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        cursor: "default",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${bloodColor}, ${bloodColor}88)`,
        borderRadius: "18px 18px 0 0",
      }} />

      {/* Blood group badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          background: `${bloodColor}1a`, color: bloodColor,
          border: `1px solid ${bloodColor}55`,
          borderRadius: 10, padding: "5px 14px",
          fontSize: "1rem", fontWeight: 900, letterSpacing: "0.04em",
        }}>
          {req.bloodGroup ?? "—"}
        </span>
        <span style={{
          background: "rgba(251,191,36,0.12)", color: "#fbbf24",
          border: "1px solid rgba(251,191,36,0.3)",
          borderRadius: 9999, padding: "3px 10px",
          fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          Pending
        </span>
      </div>

      {/* Recipient Name */}
      <div>
        <p style={{ margin: 0, fontSize: "0.68rem", color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>
          Recipient
        </p>
        <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>
          {req.recipientName ?? "—"}
        </p>
      </div>

      {/* Location */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
        <MapPin size={14} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontSize: "0.68rem", color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Location</p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>
            {[req.recipientDistrict, req.recipientUpazila].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
      </div>

      {/* Date & Time */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarDays size={14} color="#64748b" />
          <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{formatDate(req.donationDate)}</span>
        </div>
        {req.donationTime && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="#64748b" />
            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{req.donationTime}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(148,163,184,0.08)" }} />

      {/* View Button */}
      <button
        onClick={() => onView(getId(req))}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          width: "100%", padding: "10px 0", borderRadius: 10,
          background: hovered ? `${bloodColor}22` : "rgba(255,255,255,0.04)",
          border: hovered ? `1px solid ${bloodColor}55` : "1px solid rgba(148,163,184,0.15)",
          color: hovered ? bloodColor : "#94a3b8",
          fontSize: "0.875rem", fontWeight: 700,
          cursor: "pointer", transition: "all 0.2s ease",
          letterSpacing: "0.02em",
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1526 50%, #0a0f1e 100%)",
      padding: "48px 20px 60px",
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        ::placeholder { color: #475569 !important; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeUp 0.4s ease" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 9999, padding: "6px 18px", marginBottom: 18,
          }}>
            <Droplets size={14} color="#f87171" />
            <span style={{ color: "#f87171", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Blood Donation Requests
            </span>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Help Save a Life Today
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "1rem", maxWidth: 520, marginInline: "auto", lineHeight: 1.6 }}>
            Browse all active blood donation requests. Click "View Details" to learn more and reach out to help.
          </p>
        </div>

        {/* ── Filters ── */}
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
          marginBottom: 28, animation: "fadeUp 0.4s ease 0.1s both",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={15} color="#64748b" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or location…"
              style={{
                width: "100%", padding: "10px 14px 10px 38px",
                background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.15)",
                borderRadius: 10, color: "#f1f5f9", fontSize: "0.875rem",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(239,68,68,0.5)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(148,163,184,0.15)"}
            />
          </div>

          {/* Blood group filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <Filter size={13} color="#64748b" />
            <button
              onClick={() => handleFilter("all")}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                border: bloodFilter === "all" ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(148,163,184,0.15)",
                background: bloodFilter === "all" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.03)",
                color: bloodFilter === "all" ? "#f87171" : "#94a3b8",
              }}
            >All</button>
            {BLOOD_GROUPS.map((bg) => {
              const c = BLOOD_COLORS[bg];
              const active = bloodFilter === bg;
              return (
                <button key={bg} onClick={() => handleFilter(bg)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
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
          <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20, animation: "fadeUp 0.4s ease 0.15s both" }}>
            Showing <strong style={{ color: "#e2e8f0" }}>{filtered.length}</strong> pending request{filtered.length !== 1 ? "s" : ""}
            {bloodFilter !== "all" ? ` · Blood group: ${bloodFilter}` : ""}
            {search ? ` · "${search}"` : ""}
          </p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(148,163,184,0.15)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "0.95rem" }}>Loading donation requests…</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#f87171", fontSize: "0.95rem" }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
            }}>
              <Droplets size={26} color="rgba(239,68,68,0.5)" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#f1f5f9", fontWeight: 700 }}>No Requests Found</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
              {bloodFilter !== "all" || search
                ? "Try adjusting your filters."
                : "There are no pending donation requests at the moment."}
            </p>
          </div>
        )}

        {/* ── Card Grid ── */}
        {!loading && !error && pageItems.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
            animation: "fadeUp 0.4s ease 0.2s both",
          }}>
            {pageItems.map((req) => (
              <RequestCard key={getId(req)} req={req} onView={handleView} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginTop: 36, flexWrap: "wrap",
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: safePage === 1 ? "rgba(148,163,184,0.3)" : "#94a3b8", cursor: safePage === 1 ? "not-allowed" : "pointer" }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const active = p === safePage;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: "0.85rem", fontWeight: active ? 700 : 500, cursor: "pointer",
                    border: active ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(148,163,184,0.12)",
                    background: active ? "rgba(239,68,68,0.15)" : "transparent",
                    color: active ? "#f87171" : "#94a3b8",
                    transition: "all 0.15s",
                  }}
                >{p}</button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: safePage === totalPages ? "rgba(148,163,184,0.3)" : "#94a3b8", cursor: safePage === totalPages ? "not-allowed" : "pointer" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}