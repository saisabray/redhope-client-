"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getAllUsers, updateUserStatus, updateUserRole } from "@/lib/Api/all-users";
import {
  ShieldCheck,
  Ban,
  CheckCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  MoreVertical,
} from "lucide-react";

// MongoDB _id may arrive as a plain string or as { $oid: "..." }
const getId = (user) =>
  typeof user._id === "object" && user._id !== null
    ? (user._id.$oid ?? String(user._id))
    : String(user._id ?? "");

const ROWS_PER_PAGE = 8;

const ROLE_COLORS = {
  admin:     { bg: "rgba(139,92,246,0.15)",  text: "#a78bfa", border: "rgba(139,92,246,0.35)" },
  volunteer: { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", border: "rgba(34,197,94,0.3)"  },
  donor:     { bg: "rgba(59,130,246,0.12)",   text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
};

const STATUS_COLORS = {
  active:  { bg: "rgba(34,197,94,0.12)",  text: "#4ade80", border: "rgba(34,197,94,0.3)"  },
  blocked: { bg: "rgba(239,68,68,0.12)",  text: "#f87171", border: "rgba(239,68,68,0.3)"  },
};

// ── Small reusable components ─────────────────────────────────────────────────

function Badge({ label, colors }) {
  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: "9999px",
      padding: "3px 11px",
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

function UserAvatar({ name, image }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (image) {
    return (
      <img src={image} alt={name} style={{
        width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
        border: "2px solid rgba(148,163,184,0.2)", flexShrink: 0,
      }} />
    );
  }

  const hue = name
    ? name.charCodeAt(0) * 13 + (name.charCodeAt(1) ?? 0) * 7
    : 200;

  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: `hsl(${hue % 360}, 55%, 38%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: "0.78rem",
      flexShrink: 0, border: "2px solid rgba(148,163,184,0.2)",
    }}>
      {initials}
    </div>
  );
}

// ── 3-dot dropdown ────────────────────────────────────────────────────────────

function ActionDropdown({ user, onStatusToggle, onRoleChange, isBusy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isActive    = user.status === "active";
  const isBlocked   = user.status === "blocked";
  const isDonor     = user.role === "donor";
  const isVolunteer = user.role === "volunteer";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions = [
    isActive  && { key: "block",     label: "Block",          icon: Ban,        color: "#f87171", onClick: () => onStatusToggle(user) },
    isBlocked && { key: "unblock",   label: "Unblock",        icon: CheckCircle,color: "#4ade80", onClick: () => onStatusToggle(user) },
    isDonor   && { key: "volunteer", label: "Make Volunteer", icon: UserCheck,  color: "#4ade80", onClick: () => onRoleChange(user, "volunteer") },
    (isDonor || isVolunteer) && { key: "admin", label: "Make Admin", icon: ShieldCheck, color: "#a78bfa", onClick: () => onRoleChange(user, "admin") },
  ].filter(Boolean);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isBusy}
        title="Actions"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.15)",
          background: open ? "rgba(255,255,255,0.07)" : "transparent",
          color: isBusy ? "rgba(148,163,184,0.35)" : "#94a3b8",
          cursor: isBusy ? "not-allowed" : "pointer",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {isBusy
          ? <div style={{ width: 14, height: 14, border: "2px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          : <MoreVertical size={16} />}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 6px)",
          zIndex: 100,
          background: "#111827",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          minWidth: 170,
          overflow: "hidden",
          animation: "dropIn 0.14s ease",
        }}>
          {actions.length === 0 ? (
            <p style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.8rem", margin: 0 }}>
              No actions available
            </p>
          ) : (
            actions.map(({ key, label, icon: Icon, color, onClick }) => (
              <button
                key={key}
                onClick={() => { onClick(); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontSize: "0.83rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = color; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#cbd5e1"; }}
              >
                <Icon size={14} style={{ color, flexShrink: 0 }} />
                {label}
              </button>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes dropIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UserTable() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState("all");
  const [page, setPage]       = useState(1);
  const [busy, setBusy]       = useState({});

  useEffect(() => {
    getAllUsers()
      .then((data) => setUsers(data))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const filtered   = useMemo(() => {
    if (filter === "all") return users;
    return users.filter((u) => u.status === filter);
  }, [users, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageUsers  = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const setUserBusy = (id, val) => setBusy((p) => ({ ...p, [id]: val }));

  const handleStatusToggle = async (user) => {
    const id        = getId(user);
    const newStatus = user.status === "active" ? "blocked" : "active";
    setUserBusy(id, true);
    try {
      await updateUserStatus(id, newStatus);
      setUsers((prev) => prev.map((u) => (getId(u) === id ? { ...u, status: newStatus } : u)));
    } catch {
      alert("Failed to update user status.");
    } finally {
      setUserBusy(id, false);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    const id = getId(user);
    setUserBusy(id, true);
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) => prev.map((u) => (getId(u) === id ? { ...u, role: newRole } : u)));
    } catch {
      alert("Failed to update user role.");
    } finally {
      setUserBusy(id, false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", padding: "40px 0" }}>
        <div style={{ width: 22, height: 22, border: "2.5px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "0.95rem" }}>Loading users…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "#f87171", padding: "20px 0", fontSize: "0.95rem" }}>⚠ {error}</div>;
  }

  // ── Filter button helper ──────────────────────────────────────────────────

  const FilterBtn = ({ val, label }) => {
    const isActive = filter === val;
    return (
      <button
        onClick={() => { setFilter(val); setPage(1); }}
        style={{
          padding: "6px 18px",
          borderRadius: 8,
          border: isActive ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(148,163,184,0.15)",
          background: isActive ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.03)",
          color: isActive ? "#f87171" : "#94a3b8",
          fontWeight: isActive ? 700 : 500,
          fontSize: "0.82rem",
          cursor: "pointer",
          transition: "all 0.18s ease",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0" }}>
          <Users size={18} color="#ef4444" />
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={14} color="#64748b" />
          <FilterBtn val="all"     label="All"     />
          <FilterBtn val="active"  label="Active"  />
          <FilterBtn val="blocked" label="Blocked" />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
              {["User", "Email", "Role", "Status", "Actions"].map((h) => (
                <th key={h} style={{
                  padding: "13px 16px", textAlign: "left",
                  color: "#64748b", fontWeight: 600,
                  fontSize: "0.72rem", letterSpacing: "0.06em",
                  textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", color: "#475569" }}>
                  No users found.
                </td>
              </tr>
            ) : pageUsers.map((user, idx) => {
              const id     = getId(user);
              const isBusy = !!busy[id];

              return (
                <tr
                  key={id || idx}
                  style={{
                    borderBottom: "1px solid rgba(148,163,184,0.07)",
                    background: idx % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.25)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,41,59,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.25)")}
                >
                  {/* User */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <UserAvatar name={user.name} image={user.image} />
                      <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{user.name ?? "—"}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{user.email ?? "—"}</td>

                  {/* Role */}
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={user.role ?? "donor"} colors={ROLE_COLORS[user.role] ?? ROLE_COLORS.donor} />
                  </td>

                  {/* Status */}
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={user.status ?? "active"} colors={STATUS_COLORS[user.status] ?? STATUS_COLORS.active} />
                  </td>

                  {/* Actions — 3-dot dropdown */}
                  <td style={{ padding: "12px 16px" }}>
                    <ActionDropdown
                      user={user}
                      isBusy={isBusy}
                      onStatusToggle={handleStatusToggle}
                      onRoleChange={handleRoleChange}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "6px 0" }}>
          <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Page {safePage} of {totalPages}</span>

          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === safePage;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: isActive ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(148,163,184,0.12)",
                    background: isActive ? "rgba(239,68,68,0.15)" : "transparent",
                    color: isActive ? "#f87171" : "#94a3b8",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.12)", background: "transparent", color: safePage === 1 ? "rgba(148,163,184,0.3)" : "#94a3b8", cursor: safePage === 1 ? "not-allowed" : "pointer" }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.12)", background: "transparent", color: safePage === totalPages ? "rgba(148,163,184,0.3)" : "#94a3b8", cursor: safePage === totalPages ? "not-allowed" : "pointer" }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}