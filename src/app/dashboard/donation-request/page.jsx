"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Droplets, Filter, ChevronLeft, ChevronRight,
  Pencil, Trash2, Clock, MapPin, CalendarDays,
  Building2, MoreVertical, Eye, CheckCircle2, XCircle,
  User2, Mail, ShieldAlert,
} from "lucide-react";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL   = process.env.NEXT_PUBLIC_BACKEND_URL;
const ROWS_PER_PAGE = 8;

const STATUS_FILTERS = ["all", "pending", "inprogress", "done", "canceled"];

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
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
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
    }}>
      {c.label}
    </span>
  );
}

function BloodBadge({ group }) {
  const color = BLOOD_COLORS[group] ?? "#f87171";
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}55`,
      borderRadius: 8, padding: "3px 10px",
      fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.04em",
    }}>
      {group}
    </span>
  );
}

// ── Action Dropdown ───────────────────────────────────────────────────────────
// role="admin"     → View, Edit, Delete, Done, Cancel
// role="volunteer" → Done, Cancel only (status update only)

function ActionDropdown({ request, role, onDelete, onEdit, onStatusChange, isBusy, router }) {
  const [open, setOpen]     = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 180 });
  const [mounted, setMounted] = useState(false);
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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

  const id           = getId(request);
  const isInProgress = request.status === "inprogress";
  const canEdit      = role === "admin" && request.status === "pending";
  const canDelete    = role === "admin" && (request.status === "pending" || request.status === "canceled");

  // Build action list based on role
  const actions = [
    // Admin-only actions
    role === "admin" && { key: "view",   label: "View Details", icon: Eye,          color: "#94a3b8", onClick: () => router.push(`/donation-requests/${id}`) },
    canEdit          && { key: "edit",   label: "Edit",         icon: Pencil,        color: "#60a5fa", onClick: () => onEdit(id) },
    canDelete        && { key: "delete", label: "Delete",       icon: Trash2,        color: "#f87171", onClick: () => onDelete(request) },
    // Both admin & volunteer
    isInProgress && { key: "done",   label: "Mark as Done", icon: CheckCircle2, color: "#4ade80", onClick: () => { onStatusChange(id, "done");     setOpen(false); } },
    isInProgress && { key: "cancel", label: "Cancel",       icon: XCircle,      color: "#f87171", onClick: () => { onStatusChange(id, "canceled"); setOpen(false); } },
  ].filter(Boolean);

  if (actions.length === 0) {
    return <span style={{ color: "#475569", fontSize: "0.78rem" }}>—</span>;
  }

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
          cursor: isBusy ? "not-allowed" : "pointer", transition: "background 0.15s",
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

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ request, onConfirm, onCancel, loading }) {
  if (!request) return null;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 99998,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#111827", border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 18, padding: "32px 28px", maxWidth: 420, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)", animation: "dropIn 0.2s ease",
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
          Permanently delete the request for <strong style={{ color: "#e2e8f0" }}>{request.recipientName}</strong>?
          This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} disabled={loading}
            style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.18)", color: "#f87171", fontSize: "0.875rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(248,113,113,0.3)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Deleting…</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AllDonationRequestsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = session?.user;
  const role = user?.role ?? "volunteer"; // fallback to least privilege

  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState("all");
  const [page, setPage]             = useState(1);
  const [busy, setBusy]             = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch ALL donation requests
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${BASE_URL}/donation-requests`)
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load donation requests."))
      .finally(() => setLoading(false));
  }, [user]);

  // Filtered & paginated
  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleFilter = (val) => { setFilter(val); setPage(1); };

  // Status change
  const handleStatusChange = async (id, newStatus) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
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
      alert("Failed to update status.");
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Edit (admin only)
  const handleEdit = (id) => {
    router.push(`/dashboard/create-donation-request?edit=${id}`);
  };

  // Delete (admin only)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = getId(deleteTarget);
    setDeleteLoading(true);
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${BASE_URL}/donation-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRequests((prev) => prev.filter((r) => getId(r) !== id));
      setDeleteTarget(null);
    } catch {
      alert("Failed to delete request.");
    } finally {
      setDeleteLoading(false);
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  // ── Auth guard ──────────────────────────────────────────────────────────────

  if (sessionLoading || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", padding: "60px 24px" }}>
        <div style={{ width: 22, height: 22, border: "2.5px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Filter pill ────────────────────────────────────────────────────────────

  const FilterPill = ({ val }) => {
    const isActive = filter === val;
    const c = STATUS_COLORS[val];
    const count = val === "all" ? requests.length : requests.filter((r) => r.status === val).length;
    return (
      <button onClick={() => handleFilter(val)} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 13px", borderRadius: 8,
        border: isActive ? (c ? `1px solid ${c.border}` : "1px solid rgba(239,68,68,0.5)") : "1px solid rgba(148,163,184,0.15)",
        background: isActive ? (c ? c.bg : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.03)",
        color: isActive ? (c ? c.text : "#f87171") : "#94a3b8",
        fontWeight: isActive ? 700 : 500, fontSize: "0.82rem", cursor: "pointer",
        transition: "all 0.15s ease", textTransform: "capitalize",
      }}>
        {val === "all" ? "All" : (STATUS_COLORS[val]?.label ?? val)}
        <span style={{
          fontSize: "0.7rem", fontWeight: 700, borderRadius: 9999, padding: "1px 7px",
          background: isActive ? "rgba(255,255,255,0.15)" : "rgba(148,163,184,0.12)",
          color: isActive ? (c ? c.text : "#f87171") : "#64748b",
        }}>{count}</span>
      </button>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "4px 0 40px", color: "#f1f5f9", fontFamily: "'Inter','Outfit',sans-serif" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Delete modal */}
      {mounted && <DeleteModal request={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Droplets size={22} color="#f87171" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              All Donation Requests
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.83rem", marginTop: 2 }}>
              {role === "admin"
                ? "Manage all blood donation requests across all users."
                : "View and update donation request statuses."}
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7, padding: "7px 14px",
          borderRadius: 10, border: role === "admin" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(59,130,246,0.3)",
          background: role === "admin" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)",
        }}>
          <ShieldAlert size={14} color={role === "admin" ? "#f87171" : "#60a5fa"} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: role === "admin" ? "#f87171" : "#60a5fa", textTransform: "capitalize", letterSpacing: "0.04em" }}>
            {role}
          </span>
        </div>
      </div>

      {/* Volunteer restriction notice */}
      {role === "volunteer" && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 16px", borderRadius: 12, marginBottom: 20,
          background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
        }}>
          <ShieldAlert size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.83rem", lineHeight: 1.5 }}>
            As a <strong style={{ color: "#60a5fa" }}>Volunteer</strong>, you can view all requests and update donation status only.
            Editing, deleting, and other actions are restricted to admins.
          </p>
        </div>
      )}

      {/* ── Card ── */}
      <div style={{
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(148,163,184,0.1)",
        borderRadius: 18, padding: "20px",
        backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0" }}>
            <Droplets size={17} color="#ef4444" />
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <Filter size={13} color="#64748b" />
            {STATUS_FILTERS.map((val) => <FilterPill key={val} val={val} />)}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#94a3b8", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: "3px solid rgba(148,163,184,0.15)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span>Loading requests…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: "center", color: "#f87171", padding: "40px 0" }}>⚠ {error}</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860, fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                  {["Recipient", "Requester", "Blood", "Location", "Date & Time", "Status", "Actions"].map((h) => (
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
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "56px 16px", textAlign: "center", color: "#475569" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Droplets size={32} color="rgba(148,163,184,0.2)" />
                        <span>
                          {filter === "all"
                            ? "No donation requests found."
                            : `No ${STATUS_COLORS[filter]?.label ?? filter} requests found.`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : pageRows.map((req, idx) => {
                  const id     = getId(req);
                  const isBusy = !!busy[id];
                  const isInProgress = req.status === "inprogress";

                  return (
                    <React.Fragment key={id}>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(148,163,184,0.07)",
                          background: idx % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.25)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,41,59,0.8)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.25)")}
                      >
                        {/* Recipient */}
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ color: "#e2e8f0", fontWeight: 600, display: "block" }}>{req.recipientName ?? "—"}</span>
                          <span style={{ color: "#64748b", fontSize: "0.73rem" }}>{req.hospitalName ?? ""}</span>
                        </td>

                        {/* Requester (admin extra info) */}
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ color: "#94a3b8", fontSize: "0.82rem", display: "block" }}>{req.requesterName ?? "—"}</span>
                          <span style={{ color: "#64748b", fontSize: "0.73rem" }}>{req.requesterEmail ?? ""}</span>
                        </td>

                        {/* Blood group */}
                        <td style={{ padding: "13px 16px" }}>
                          <BloodBadge group={req.bloodGroup ?? "—"} />
                        </td>

                        {/* Location */}
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", fontSize: "0.85rem" }}>
                            <MapPin size={12} color="#64748b" />
                            {[req.recipientDistrict, req.recipientUpazila].filter(Boolean).join(", ") || "—"}
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                            <CalendarDays size={12} color="#64748b" />
                            {formatDate(req.donationDate)}
                          </div>
                          {req.donationTime && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: "0.73rem", marginTop: 2 }}>
                              <Clock size={11} />{req.donationTime}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "13px 16px" }}>
                          <StatusBadge status={req.status ?? "pending"} />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "13px 16px" }}>
                          <ActionDropdown
                            request={req}
                            role={role}
                            isBusy={isBusy}
                            onEdit={handleEdit}
                            onDelete={(r) => setDeleteTarget(r)}
                            onStatusChange={handleStatusChange}
                            router={router}
                          />
                        </td>
                      </tr>

                      {/* Donor info row — inprogress only */}
                      {isInProgress && (req.donorName || req.donorEmail) && (
                        <tr style={{ background: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(148,163,184,0.07)" }}>
                          <td colSpan={7} style={{ padding: "9px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#60a5fa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                Donor Info
                              </span>
                              {req.donorName && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: "0.82rem" }}>
                                  <User2 size={12} color="#60a5fa" />
                                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{req.donorName}</span>
                                </div>
                              )}
                              {req.donorEmail && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: "0.82rem" }}>
                                  <Mail size={12} color="#60a5fa" />
                                  <span>{req.donorEmail}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "4px 0" }}>
            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
              Page {safePage} of {totalPages} · {filtered.length} total
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.12)", background: "transparent", color: safePage === 1 ? "rgba(148,163,184,0.3)" : "#94a3b8", cursor: safePage === 1 ? "not-allowed" : "pointer" }}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === safePage;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: isActive ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(148,163,184,0.12)",
                    background: isActive ? "rgba(239,68,68,0.15)" : "transparent",
                    color: isActive ? "#f87171" : "#94a3b8",
                    fontWeight: isActive ? 700 : 500, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s",
                  }}>{p}</button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.12)", background: "transparent", color: safePage === totalPages ? "rgba(148,163,184,0.3)" : "#94a3b8", cursor: safePage === totalPages ? "not-allowed" : "pointer" }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
