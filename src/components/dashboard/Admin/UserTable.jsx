"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
  admin:     { bg: "bg-purple-500/15",  text: "text-purple-400", border: "border-purple-500/35" },
  volunteer: { bg: "bg-green-500/15",   text: "text-green-400",  border: "border-green-500/30"  },
  donor:     { bg: "bg-blue-500/15",    text: "text-blue-400",   border: "border-blue-500/30" },
};

const STATUS_COLORS = {
  active:  { bg: "bg-green-500/15",  text: "text-green-400", border: "border-green-500/30"  },
  blocked: { bg: "bg-red-500/15",    text: "text-red-400",   border: "border-red-500/30"  },
};

// ── Small reusable components ─────────────────────────────────────────────────

function Badge({ label, colors }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[0.72rem] font-semibold tracking-[0.04em] capitalize border ${colors.bg} ${colors.text} ${colors.border}`}>
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
      <img src={image} alt={name} className="w-9 h-9 rounded-full object-cover border-2 border-slate-400/20 shrink-0" />
    );
  }

  const hue = name
    ? name.charCodeAt(0) * 13 + (name.charCodeAt(1) ?? 0) * 7
    : 200;

  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[0.78rem] shrink-0 border-2 border-slate-400/20"
         style={{ background: `hsl(${hue % 360}, 55%, 38%)` }}>
      {initials}
    </div>
  );
}

// ── 3-dot dropdown ────────────────────────────────────────────────────────────
// Renders via portal so overflow:auto on the table never clips the menu.

function ActionDropdown({ user, onStatusToggle, onRoleChange, isBusy }) {
  const [open, setOpen]       = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 175 });
  const [mounted, setMounted] = useState(false);
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const isActive    = user.status === "active";
  const isBlocked   = user.status === "blocked";
  const isDonor     = user.role === "donor";
  const isVolunteer = user.role === "volunteer";

  // Close on outside click
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

  // Reposition on scroll / resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 175;
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
      const menuW = 175;
      setMenuPos({ top: r.bottom + 6, left: Math.max(8, r.right - menuW), width: menuW });
    }
    setOpen((v) => !v);
  };

  const actions = [
    isActive  && { key: "block",     label: "Block",          icon: Ban,        color: "text-red-400", onClick: () => onStatusToggle(user) },
    isBlocked && { key: "unblock",   label: "Unblock",        icon: CheckCircle,color: "text-green-400", onClick: () => onStatusToggle(user) },
    isDonor   && { key: "volunteer", label: "Make Volunteer", icon: UserCheck,  color: "text-green-400", onClick: () => onRoleChange(user, "volunteer") },
    (isDonor || isVolunteer) && { key: "admin", label: "Make Admin", icon: ShieldCheck, color: "text-purple-400", onClick: () => onRoleChange(user, "admin") },
  ].filter(Boolean);

  const menu = (
    <div ref={menuRef} 
         className="fixed z-[99999] bg-gray-900 border border-slate-400/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden animate-[dropIn_0.14s_ease]"
         style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}>
      {actions.length === 0 ? (
        <p className="px-4 py-3 text-slate-500 text-xs m-0">
          No actions available
        </p>
      ) : (
        actions.map(({ key, label, icon: Icon, color, onClick }) => (
          <button
            key={key}
            onClick={() => { onClick(); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none text-slate-300 text-[0.83rem] font-medium cursor-pointer text-left transition-colors hover:bg-white/5 hover:${color} group`}
          >
            <Icon size={14} className={`shrink-0 group-hover:${color}`} />
            <span className={`group-hover:${color}`}>{label}</span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="inline-block">
      <style>{`
        @keyframes dropIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={isBusy}
        title="Actions"
        className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-slate-400/15 transition-colors duration-150 ${open ? 'bg-white/5' : 'bg-transparent'} ${isBusy ? 'text-slate-400/35 cursor-not-allowed' : 'text-slate-400 cursor-pointer hover:bg-white/5'}`}
      >
        {isBusy
          ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400/20 border-t-red-500 animate-[spin_0.7s_linear_infinite]" />
          : <MoreVertical size={16} />}
      </button>
      {open && mounted && createPortal(menu, document.body)}
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
      <div className="flex flex-col items-center justify-center gap-3.5 text-slate-400 py-15 min-h-[200px]">
        <div className="w-9 h-9 rounded-full border-[3px] border-slate-400/15 border-t-red-500 animate-[spin_0.8s_linear_infinite]" />
        <span className="text-[0.9rem] tracking-[0.02em]">Loading users…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-400 py-10 text-[0.95rem] gap-2">
        ⚠ {error}
      </div>
    );
  }

  // ── Filter button helper ──────────────────────────────────────────────────

  const FilterBtn = ({ val, label }) => {
    const isActive = filter === val;
    return (
      <button
        onClick={() => { setFilter(val); setPage(1); }}
        className={`px-[18px] py-1.5 rounded-lg border text-[0.82rem] cursor-pointer transition-all duration-150 ${isActive ? 'border-red-500/50 bg-red-500/15 text-red-400 font-bold' : 'border-slate-400/15 bg-white/5 text-slate-400 font-medium'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-slate-200">
          <Users size={18} className="text-red-500" />
          <span className="font-semibold text-[0.95rem]">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <FilterBtn val="all"     label="All"     />
          <FilterBtn val="active"  label="Active"  />
          <FilterBtn val="blocked" label="Blocked" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[14px] border border-slate-400/10">
        <table className="w-full border-collapse min-w-[700px] text-sm">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-400/10">
              {["User", "Email", "Role", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-[13px] text-left text-slate-500 font-semibold text-[0.72rem] tracking-[0.06em] uppercase whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center text-slate-600">
                  No users found.
                </td>
              </tr>
            ) : pageUsers.map((user, idx) => {
              const id     = getId(user);
              const isBusy = !!busy[id];

              return (
                <tr
                  key={id || idx}
                  className={`border-b border-slate-400/[0.07] transition-colors hover:bg-slate-800/80 ${idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/25'}`}
                >
                  {/* User */}
                  <td className="p-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={user.name} image={user.image} />
                      <span className="text-slate-200 font-medium">{user.name ?? "—"}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="p-3 px-4 text-slate-400">{user.email ?? "—"}</td>

                  {/* Role */}
                  <td className="p-3 px-4">
                    <Badge label={user.role ?? "donor"} colors={ROLE_COLORS[user.role] ?? ROLE_COLORS.donor} />
                  </td>

                  {/* Status */}
                  <td className="p-3 px-4">
                    <Badge label={user.status ?? "active"} colors={STATUS_COLORS[user.status] ?? STATUS_COLORS.active} />
                  </td>

                  {/* Actions — 3-dot dropdown */}
                  <td className="p-3 px-4">
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
        <div className="flex items-center justify-between flex-wrap gap-2 py-1.5">
          <span className="text-slate-500 text-xs">Page {safePage} of {totalPages}</span>

          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === safePage;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg border text-[0.82rem] cursor-pointer transition-all duration-150 ${isActive ? 'border-red-500/50 bg-red-500/15 text-red-400 font-bold' : 'border-slate-400/10 bg-transparent text-slate-400 font-medium'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={`px-2.5 py-1 rounded-lg border border-slate-400/10 bg-transparent ${safePage === 1 ? 'text-slate-400/30 cursor-not-allowed' : 'text-slate-400 cursor-pointer'}`}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={`px-2.5 py-1 rounded-lg border border-slate-400/10 bg-transparent ${safePage === totalPages ? 'text-slate-400/30 cursor-not-allowed' : 'text-slate-400 cursor-pointer'}`}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}