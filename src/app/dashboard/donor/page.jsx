"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Droplets, MapPin, CalendarDays, Clock, Eye,
  Pencil, Trash2, CheckCircle2, XCircle,
  ChevronRight, User2, Mail, Sparkles, MoreVertical,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const STATUS_COLORS = {
  pending:    { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.35)",  label: "Pending"     },
  inprogress: { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.35)",  label: "In Progress" },
  done:       { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", border: "rgba(34,197,94,0.3)",    label: "Done"        },
  canceled:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.3)",    label: "Canceled"    },
};

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
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 9999, padding: "3px 11px",
      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>{c.label}</span>
  );
}

function BloodBadge({ group }) {
  const color = BLOOD_COLORS[group] ?? "#f87171";
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}55`,
      borderRadius: 8, padding: "3px 10px",
      fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.04em",
    }}>{group}</span>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ request, onConfirm, onCancel, loading }) {
  if (!request) return null;
  const modal = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#111827", border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 18, padding: "32px 28px", maxWidth: 420, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)", animation: "fadeUp 0.2s ease",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
        }}>
          <Trash2 size={22} color="#f87171" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", textAlign: "center" }}>
          Delete Request?
        </h3>
        <p style={{ margin: "0 0 24px", color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", lineHeight: 1.6 }}>
          Permanently delete the request for{" "}
          <strong style={{ color: "#e2e8f0" }}>{request.recipientName}</strong>?
          This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} disabled={loading}
            style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.18)", color: "#f87171", fontSize: "0.875rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(248,113,113,0.3)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Deleting…</>
              : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ── Action Dropdown ───────────────────────────────────────────────────────────

function ActionDropdown({ req, onDelete, onStatusChange, busyId, router }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 180 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const id = getId(req);
  const isBusy = busyId === id;
  const isInProgress = req.status === "inprogress";
  const canEdit   = req.status === "pending";
  const canDelete = req.status === "pending" || req.status === "canceled";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 180;
      setMenuPos({ top: r.bottom + 6, left: Math.max(8, r.right - menuW), width: menuW });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [open]);

  const handleToggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 180;
      setMenuPos({ top: r.bottom + 6, left: Math.max(8, r.right - menuW), width: menuW });
    }
    setOpen((v) => !v);
  };

  const actions = [
    { key: "view",   label: "View Details", icon: Eye,          color: "#94a3b8", onClick: () => router.push(`/dashboard/donation-requests/${id}`) },
    canEdit   && { key: "edit",   label: "Edit",         icon: Pencil,       color: "#60a5fa", onClick: () => router.push(`/dashboard/create-donation-request?edit=${id}`) },
    canDelete && { key: "delete", label: "Delete",       icon: Trash2,       color: "#f87171", onClick: () => onDelete(req) },
    isInProgress && { key: "done",   label: "Mark as Done", icon: CheckCircle2, color: "#4ade80", onClick: () => { onStatusChange(id, "done");     setOpen(false); } },
    isInProgress && { key: "cancel", label: "Cancel",       icon: XCircle,     color: "#f87171", onClick: () => { onStatusChange(id, "canceled"); setOpen(false); } },
  ].filter(Boolean);

  const menu = (
    <div ref={menuRef} style={{
      position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width,
      zIndex: 99999, background: "#111827",
      border: "1px solid rgba(148,163,184,0.12)", borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.7)", overflow: "hidden",
      animation: "dropIn 0.14s ease",
    }}>
      {actions.map(({ key, label, icon: Icon, color, onClick }) => (
        <button key={key}
          onClick={() => { onClick(); setOpen(false); }}
          disabled={isBusy && (key === "done" || key === "cancel")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "10px 16px",
            border: "none", background: "transparent",
            color: "#cbd5e1", fontSize: "0.83rem", fontWeight: 500,
            cursor: (isBusy && (key === "done" || key === "cancel")) ? "not-allowed" : "pointer",
            textAlign: "left", transition: "background 0.12s",
            opacity: (isBusy && (key === "done" || key === "cancel")) ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = color; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#cbd5e1"; }}
        >
          <Icon size={14} style={{ color, flexShrink: 0 }} />
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "inline-block" }}>
      <button ref={btnRef} onClick={handleToggle} disabled={isBusy}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.15)",
          background: open ? "rgba(255,255,255,0.07)" : "transparent",
          color: isBusy ? "rgba(148,163,184,0.35)" : "#94a3b8",
          cursor: isBusy ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {isBusy
          ? <div style={{ width: 14, height: 14, border: "2px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          : <MoreVertical size={16} />}
      </button>
      {open && mounted && createPortal(menu, document.body)}
    </div>
  );
}

// ── Request Row ───────────────────────────────────────────────────────────────

function RequestRow({ req, idx, onDelete, onStatusChange, busyId }) {
  const router = useRouter();
  const id = getId(req);
  const isInProgress = req.status === "inprogress";

  return (
    <>
      <tr
        style={{
          borderBottom: "1px solid rgba(148,163,184,0.07)",
          background: idx % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.25)",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,41,59,0.8)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.25)")}
      >
        {/* Recipient Name */}
        <td style={{ padding: "13px 16px" }}>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{req.recipientName ?? "—"}</span>
        </td>

        {/* Location */}
        <td style={{ padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", fontSize: "0.85rem" }}>
            <MapPin size={13} color="#64748b" />
            <span>{[req.recipientDistrict, req.recipientUpazila].filter(Boolean).join(", ") || "—"}</span>
          </div>
        </td>

        {/* Date & Time */}
        <td style={{ padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            <CalendarDays size={13} color="#64748b" />
            {formatDate(req.donationDate)}
          </div>
          {req.donationTime && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.75rem", marginTop: 3 }}>
              <Clock size={11} />
              {req.donationTime}
            </div>
          )}
        </td>

        {/* Blood Group */}
        <td style={{ padding: "13px 16px" }}>
          <BloodBadge group={req.bloodGroup ?? "—"} />
        </td>

        {/* Status */}
        <td style={{ padding: "13px 16px" }}>
          <StatusBadge status={req.status ?? "pending"} />
        </td>

        {/* 3-dot Actions */}
        <td style={{ padding: "13px 16px" }}>
          <ActionDropdown
            req={req}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            busyId={busyId}
            router={router}
          />
        </td>
      </tr>

      {/* Donor Info row — only when inprogress */}
      {isInProgress && (req.donorName || req.donorEmail) && (
        <tr style={{ background: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(148,163,184,0.07)" }}>
          <td colSpan={6} style={{ padding: "10px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#60a5fa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Donor Info
              </span>
              {req.donorName && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: "0.82rem" }}>
                  <User2 size={13} color="#60a5fa" />
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{req.donorName}</span>
                </div>
              )}
              {req.donorEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: "0.82rem" }}>
                  <Mail size={13} color="#60a5fa" />
                  <span>{req.donorEmail}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DonorDashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyId, setBusyId]     = useState(null);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch this donor's requests
  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch(`${BASE_URL}/donation-requests/my/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  // Show only 3 most recent
  const recent = requests.slice(0, 3);

  // Status change (inprogress → done / canceled)
  const handleStatusChange = async (id, newStatus) => {
    setBusyId(id);
    try {
      const res = await fetch(`${BASE_URL}/donation-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setRequests((prev) =>
        prev.map((r) => (getId(r) === id ? { ...r, status: newStatus } : r))
      );
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = getId(deleteTarget);
    setDeleteLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/donation-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRequests((prev) => prev.filter((r) => getId(r) !== id));
      setDeleteTarget(null);
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Greeting ─────────────────────────────────────────────────────────────────

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", padding: "60px 24px" }}>
        <div style={{ width: 22, height: 22, border: "2.5px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "4px 0 40px", color: "#f1f5f9", minHeight: "100%" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Delete Modal */}
      {mounted && (
        <DeleteModal
          request={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Welcome Section ─────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 900, margin: "0 auto 32px",
        background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(15,23,42,0.6) 60%)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 20, padding: "32px 32px",
        backdropFilter: "blur(14px)",
        animation: "fadeUp 0.4s ease",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blob */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(239,68,68,0.15), transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: user?.image ? "transparent" : `hsl(${(user?.name ?? "D").charCodeAt(0) * 13 % 360}, 55%, 38%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "3px solid rgba(239,68,68,0.4)",
            boxShadow: "0 0 24px rgba(239,68,68,0.2)",
            flexShrink: 0, overflow: "hidden",
          }}>
            {user?.image
              ? <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700 }}>
                  {(user?.name ?? "D").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Sparkles size={15} color="#fbbf24" />
              <span style={{ fontSize: "0.8rem", color: "#fbbf24", fontWeight: 600, letterSpacing: "0.04em" }}>
                {greeting}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {user?.name ?? "Donor"} 👋
            </h1>
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Welcome to your donor dashboard. You can manage your donation requests and track their status here.
            </p>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Total",      count: requests.length,                                       color: "#94a3b8" },
              { label: "Pending",    count: requests.filter((r) => r.status === "pending").length,    color: "#fbbf24" },
              { label: "In Progress",count: requests.filter((r) => r.status === "inprogress").length, color: "#60a5fa" },
              { label: "Done",       count: requests.filter((r) => r.status === "done").length,       color: "#4ade80" },
            ].map(({ label, count, color }) => (
              <div key={label} style={{
                textAlign: "center", padding: "10px 16px",
                background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.1)",
                borderRadius: 12, minWidth: 68,
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600, marginTop: 4, whiteSpace: "nowrap" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Requests Section ──────────────────────────────────────────── */}
      {(loading || recent.length > 0) && (
        <div style={{ maxWidth: 900, margin: "0 auto", animation: "fadeUp 0.5s ease 0.1s both" }}>

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))",
                border: "1px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Droplets size={17} color="#f87171" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9" }}>
                  Recent Donation Requests
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.78rem" }}>
                  Your 3 most recent requests
                </p>
              </div>
            </div>

            <Link href="/dashboard/my-donation-requests" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 10,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)",
              color: "#f87171", fontSize: "0.82rem", fontWeight: 700,
              textDecoration: "none", transition: "background 0.18s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
            >
              View All Requests <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(15,23,42,0.7)",
            border: "1px solid rgba(148,163,184,0.1)",
            borderRadius: 18, backdropFilter: "blur(12px)",
            overflow: "hidden",
          }}>
            {/* Top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)" }} />

            {/* Loading skeleton */}
            {loading ? (
              <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#94a3b8" }}>
                <div style={{ width: 32, height: 32, border: "3px solid rgba(148,163,184,0.15)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: "0.9rem" }}>Loading requests…</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780, fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                      {["Recipient Name", "Location", "Date & Time", "Blood Group", "Status", "Actions"].map((h) => (
                        <th key={h} style={{
                          padding: "13px 16px", textAlign: "left",
                          color: "#64748b", fontWeight: 600,
                          fontSize: "0.72rem", letterSpacing: "0.06em",
                          textTransform: "uppercase", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((req, idx) => (
                      <RequestRow
                        key={getId(req) || idx}
                        req={req}
                        idx={idx}
                        onDelete={setDeleteTarget}
                        onStatusChange={handleStatusChange}
                        busyId={busyId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {!loading && requests.length > 3 && (
              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(148,163,184,0.08)",
                display: "flex", justifyContent: "center",
              }}>
                <Link href="/dashboard/my-donation-requests" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "#f87171", fontSize: "0.83rem", fontWeight: 600,
                  textDecoration: "none",
                }}>
                  See all {requests.length} requests <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state (no requests yet) ───────────────────────────────────── */}
      {!loading && recent.length === 0 && (
        <div style={{ maxWidth: 900, margin: "0 auto", animation: "fadeUp 0.5s ease 0.15s both" }}>
          <div style={{
            background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.1)",
            borderRadius: 18, padding: "52px 32px", textAlign: "center",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
            }}>
              <Droplets size={26} color="rgba(239,68,68,0.5)" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9" }}>
              No Donation Requests Yet
            </h3>
            <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6 }}>
              You haven't made any donation requests. Create your first request to find a blood donor.
            </p>
            <Link href="/dashboard/create-donation-request" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 24px", borderRadius: 10,
              background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)",
              color: "#f87171", fontSize: "0.9rem", fontWeight: 700,
              textDecoration: "none",
            }}>
              <Droplets size={16} /> Create Donation Request
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}