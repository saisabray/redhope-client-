"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Droplets, Filter, ChevronLeft, ChevronRight,
  Pencil, Trash2, X, Check, Clock, MapPin,
  CalendarDays, Building2, MoreVertical, Plus, Eye,
} from "lucide-react";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const ROWS_PER_PAGE = 6;

const STATUS_FILTERS = ["all", "pending", "inprogress", "done", "canceled"];

const STATUS_COLORS = {
  pending:    { bg: "bg-amber-400/10",  text: "text-amber-400", border: "border-amber-400/35",  label: "Pending"     },
  inprogress: { bg: "bg-blue-500/10",  text: "text-blue-400", border: "border-blue-500/35",  label: "In Progress" },
  done:       { bg: "bg-green-500/10",   text: "text-green-400", border: "border-green-500/30",    label: "Done"        },
  canceled:   { bg: "bg-red-500/10",   text: "text-red-400", border: "border-red-500/30",    label: "Canceled"    },
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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span className={`px-[11px] py-[3px] rounded-full text-[0.72rem] font-bold tracking-[0.04em] capitalize whitespace-nowrap border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

function BloodBadge({ group }) {
  const color = BLOOD_COLORS[group] ?? "#f87171";
  return (
    <span 
      className="px-2.5 py-[3px] rounded-lg text-[0.78rem] font-extrabold tracking-[0.04em]"
      style={{
        background: `${color}18`, color, border: `1px solid ${color}55`,
      }}
    >
      {group}
    </span>
  );
}

// ── Action Dropdown ───────────────────────────────────────────────────────────

function ActionDropdown({ request, onDelete, onEdit, isBusy, router }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 160 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client before using createPortal
  useEffect(() => { setMounted(true); }, []);

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

  // Recalculate position on scroll / resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 160;
      setMenuPos({
        top:   r.bottom + 6,
        left:  Math.max(8, r.right - menuW),
        width: menuW,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const handleToggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuW = 160;
      setMenuPos({
        top:   r.bottom + 6,
        left:  Math.max(8, r.right - menuW),
        width: menuW,
      });
    }
    setOpen((v) => !v);
  };

  const canEdit   = request.status === "pending";
  const canDelete = request.status === "pending" || request.status === "canceled";

  const id = getId(request);

  const actions = [
    { key: "view",   label: "View Details", icon: Eye,    color: "text-slate-400", onClick: () => router.push(`/donation-requests/${id}`) },
    canEdit   && { key: "edit",   label: "Edit",   icon: Pencil, color: "text-blue-400", onClick: () => onEdit(request) },
    canDelete && { key: "delete", label: "Delete", icon: Trash2, color: "text-red-400", onClick: () => onDelete(request) },
  ].filter(Boolean);

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[99999] bg-gray-900 border border-slate-400/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden animate-[dropIn_0.14s_ease]"
      style={{
        top:  menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
      }}
    >
      {actions.length === 0 ? (
        <p className="p-[12px_16px] text-slate-500 text-[0.8rem] m-0">
          No actions available
        </p>
      ) : actions.map(({ key, label, icon: Icon, color, onClick }) => (
        <button
          key={key}
          onClick={() => { onClick(); setOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none text-slate-300 text-[0.83rem] font-medium cursor-pointer text-left transition-colors group hover:bg-white/5`}
        >
          <Icon size={14} className={`shrink-0 ${color} group-hover:${color}`} />
          <span className={`group-hover:${color}`}>{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={isBusy}
        title="Actions"
        className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-slate-400/15 transition-all duration-150 ${open ? 'bg-white/5' : 'bg-transparent hover:bg-white/5'} ${isBusy ? 'text-slate-400/35 cursor-not-allowed' : 'text-slate-400 cursor-pointer'}`}
      >
        {isBusy
          ? <div className="w-3.5 h-3.5 border-2 border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.7s_linear_infinite]" />
          : <MoreVertical size={16} />}
      </button>

      {/* Render menu into document.body to escape all overflow/stacking contexts */}
      {open && mounted && createPortal(menu, document.body)}

      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ request, onConfirm, onCancel, loading }) {
  if (!request) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-slate-400/10 rounded-[18px] p-[32px_28px] w-full max-w-[420px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-[dropIn_0.2s_ease]">
        <div className="w-[52px] h-[52px] rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4.5">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="m-0 mb-2 text-[1.1rem] font-bold text-slate-100 text-center">
          Delete Request?
        </h3>
        <p className="m-0 mb-6 text-slate-400 text-[0.875rem] text-center leading-relaxed">
          This will permanently delete the donation request for{" "}
          <strong className="text-slate-200">{request.recipientName}</strong>.
          This action cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-[22px] py-[9px] rounded-[10px] border border-slate-400/20 bg-white/5 text-slate-400 text-[0.875rem] font-semibold cursor-pointer transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 px-[22px] py-[9px] rounded-[10px] border border-red-500/40 bg-red-500/20 text-red-400 text-[0.875rem] font-bold transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-red-500/30'}`}
          >
            {loading
              ? <><div className="w-[13px] h-[13px] border-2 border-red-400/30 border-t-red-400 rounded-full animate-[spin_0.7s_linear_infinite]" /> Deleting…</>
              : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyDonationRequestsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = session?.user;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState("all");
  const [page, setPage]         = useState(1);
  const [busy, setBusy]         = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch this user's requests
  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch(`${BASE_URL}/donation-requests/my/${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load donation requests."))
      .finally(() => setLoading(false));
  }, [user?.email]);

  // Filtered & paginated data
  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  // Filter change resets to page 1
  const handleFilter = (val) => { setFilter(val); setPage(1); };

  // Delete
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
      alert("Failed to delete request. Please try again.");
    } finally {
      setDeleteLoading(false);
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Edit — navigate to edit page (future) or reuse create page
  const handleEdit = (request) => {
    const id = getId(request);
    router.push(`/dashboard/create-donation-request?edit=${id}`);
  };

  // ── Loading / Auth ─────────────────────────────────────────────────────────

  if (sessionLoading || (!user && !sessionLoading)) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-[60px] px-6">
        <div className="w-[22px] h-[22px] border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>Loading…</span>
      </div>
    );
  }

  // ── Filter pill component ──────────────────────────────────────────────────

  const FilterPill = ({ val }) => {
    const isActive = filter === val;
    const c = STATUS_COLORS[val];
    const count = val === "all" ? requests.length : requests.filter((r) => r.status === val).length;
    return (
      <button
        onClick={() => handleFilter(val)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[0.82rem] font-medium cursor-pointer transition-all duration-150 capitalize ${isActive ? (c ? `${c.bg} border-[${c.border}] ${c.text}` : 'bg-red-500/15 border-red-500/50 text-red-400 font-bold') : 'bg-white/5 border-slate-400/15 text-slate-400 hover:bg-white/10'}`}
      >
        {val === "all" ? "All" : (STATUS_COLORS[val]?.label ?? val)}
        <span className={`text-[0.7rem] font-bold rounded-full px-2 py-[1px] ${isActive ? (c ? `${c.text} bg-white/15` : 'text-red-400 bg-white/15') : 'text-slate-500 bg-slate-400/10'}`}>
          {count}
        </span>
      </button>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pt-1 pb-10 text-slate-100">

      {/* Delete modal */}
      <DeleteModal
        request={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3.5 mb-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[linear-gradient(135deg,rgba(239,68,68,0.25),rgba(220,38,38,0.15))] border border-red-500/30 flex items-center justify-center">
            <Droplets size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="m-0 text-[1.5rem] font-bold text-slate-100 tracking-[-0.02em]">
              My Donation Requests
            </h1>
            <p className="m-0 mt-0.5 text-slate-500 text-[0.83rem]">
              All blood donation requests you have submitted.
            </p>
          </div>
        </div>

        <Link href="/dashboard/create-donation-request" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-red-500/20 border border-red-500/40 text-red-400 text-[0.875rem] font-bold no-underline transition-colors hover:bg-red-500/30">
          <Plus size={15} /> New Request
        </Link>
      </div>

      {/* ── Card ── */}
      <div className="bg-slate-900/70 border border-slate-400/10 rounded-[18px] p-5 backdrop-blur-md flex flex-col gap-4">

        {/* Table toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Droplets size={17} className="text-red-500" />
            <span className="font-semibold text-[0.95rem]">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-slate-500" />
            {STATUS_FILTERS.map((val) => <FilterPill key={val} val={val} />)}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3.5 text-slate-400 py-15">
            <div className="w-9 h-9 border-[3px] border-slate-400/15 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
            <span className="text-[0.9rem]">Loading requests…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center justify-center text-red-400 py-10 text-[0.95rem] gap-2">
            ⚠ {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-[14px] border border-slate-400/10">
            <table className="w-full border-collapse min-w-[780px] text-[0.875rem]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-400/10">
                  {["Recipient Name", "Blood Group", "District", "Hospital", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="p-[13px_16px] text-left text-slate-500 font-semibold text-[0.72rem] tracking-[0.06em] uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-[56px_16px] text-center text-slate-600">
                      <div className="flex flex-col items-center gap-2.5">
                        <Droplets size={32} className="text-slate-500/30" />
                        <span className="text-[0.9rem]">
                          {filter === "all"
                            ? "You haven't made any donation requests yet."
                            : `No ${STATUS_COLORS[filter]?.label ?? filter} requests found.`}
                        </span>
                        {filter === "all" && (
                          <Link href="/dashboard/create-donation-request" className="text-red-400 text-[0.83rem] font-semibold no-underline mt-1 hover:underline">
                            + Create your first request
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : pageRows.map((req, idx) => {
                  const id     = getId(req);
                  const isBusy = !!busy[id];
                  return (
                    <tr
                      key={id || idx}
                      className={`border-b border-slate-400/[0.07] transition-colors hover:bg-slate-800/80 ${idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/25'}`}
                    >
                      {/* Recipient Name */}
                      <td className="p-[13px_16px]">
                        <div>
                          <span className="text-slate-200 font-semibold block">{req.recipientName ?? "—"}</span>
                          <span className="text-slate-500 text-[0.75rem]">{req.recipientUpazila ?? ""}</span>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="p-[13px_16px]">
                        <BloodBadge group={req.bloodGroup ?? "—"} />
                      </td>

                      {/* District */}
                      <td className="p-[13px_16px]">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin size={13} className="text-slate-500" />
                          {req.recipientDistrict ?? "—"}
                        </div>
                      </td>

                      {/* Hospital */}
                      <td className="p-[13px_16px] text-slate-400 max-w-[200px]">
                        <div className="flex items-start gap-1.5">
                          <Building2 size={13} className="text-slate-500 shrink-0 mt-0.5" />
                          <span className="text-[0.83rem] leading-[1.4]">{req.hospitalName ?? "—"}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-[13px_16px]">
                        <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                          <CalendarDays size={13} className="text-slate-500" />
                          {formatDate(req.donationDate)}
                        </div>
                        {req.donationTime && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[0.75rem] mt-0.5">
                            <Clock size={11} />
                            {req.donationTime}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-[13px_16px]">
                        <StatusBadge status={req.status ?? "pending"} />
                      </td>

                      {/* Actions */}
                      <td className="p-[13px_16px]">
                        <ActionDropdown
                          request={req}
                          isBusy={isBusy}
                          onEdit={handleEdit}
                          onDelete={(r) => setDeleteTarget(r)}
                          router={router}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-2 py-1">
            <span className="text-slate-500 text-[0.8rem]">
              Page {safePage} of {totalPages} · {filtered.length} total
            </span>

            <div className="flex gap-1.5 items-center">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={`px-2.5 py-1.5 rounded-lg border border-slate-400/10 bg-transparent transition-colors ${safePage === 1 ? 'text-slate-500/50 cursor-not-allowed' : 'text-slate-400 cursor-pointer hover:bg-white/5'}`}
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === safePage;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg border text-[0.82rem] cursor-pointer transition-all duration-150 ${isActive ? 'border-red-500/50 bg-red-500/15 text-red-400 font-bold' : 'border-slate-400/10 bg-transparent text-slate-400 font-medium hover:bg-white/5'}`}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className={`px-2.5 py-1.5 rounded-lg border border-slate-400/10 bg-transparent transition-colors ${safePage === totalPages ? 'text-slate-500/50 cursor-not-allowed' : 'text-slate-400 cursor-pointer hover:bg-white/5'}`}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
