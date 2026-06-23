"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getMyDonationRequests, updateDonationRequestStatus, deleteDonationRequest } from "@/lib/Api/donation-requests";
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

function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span className={`px-[11px] py-[3px] rounded-full text-[0.72rem] font-bold tracking-[0.04em] whitespace-nowrap border ${c.bg} ${c.text} ${c.border}`}>
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
    >{group}</span>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ request, onConfirm, onCancel, loading }) {
  if (!request) return null;
  const modal = (
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-slate-400/10 rounded-[18px] p-[32px_28px] w-full max-w-[420px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-[fadeUp_0.2s_ease]">
        <div className="w-[52px] h-[52px] rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4.5">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="m-0 mb-2 text-[1.1rem] font-bold text-slate-100 text-center">
          Delete Request?
        </h3>
        <p className="m-0 mb-6 text-slate-400 text-[0.875rem] text-center leading-relaxed">
          Permanently delete the request for{" "}
          <strong className="text-slate-200">{request.recipientName}</strong>?
          This cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button onClick={onCancel} disabled={loading}
            className="px-[22px] py-[9px] rounded-[10px] border border-slate-400/20 bg-white/5 text-slate-400 text-[0.875rem] font-semibold cursor-pointer transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
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
    { key: "view",   label: "View Details", icon: Eye,          color: "text-slate-400", onClick: () => router.push(`/donation-requests/${id}`) },
    canEdit   && { key: "edit",   label: "Edit",         icon: Pencil,       color: "text-blue-400", onClick: () => router.push(`/dashboard/create-donation-request?edit=${id}`) },
    canDelete && { key: "delete", label: "Delete",       icon: Trash2,       color: "text-red-400", onClick: () => onDelete(req) },
    isInProgress && { key: "done",   label: "Mark as Done", icon: CheckCircle2, color: "text-green-400", onClick: () => { onStatusChange(id, "done");     setOpen(false); } },
    isInProgress && { key: "cancel", label: "Cancel",       icon: XCircle,     color: "text-red-400", onClick: () => { onStatusChange(id, "canceled"); setOpen(false); } },
  ].filter(Boolean);

  const menu = (
    <div ref={menuRef} className="fixed z-[99999] bg-gray-900 border border-slate-400/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden animate-[dropIn_0.14s_ease]"
         style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}>
      {actions.map(({ key, label, icon: Icon, color, onClick }) => (
        <button key={key}
          onClick={() => { onClick(); setOpen(false); }}
          disabled={isBusy && (key === "done" || key === "cancel")}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none text-slate-300 text-[0.83rem] font-medium text-left transition-colors group hover:bg-white/5 hover:${color} ${(isBusy && (key === "done" || key === "cancel")) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <Icon size={14} className={`shrink-0 group-hover:${color}`} />
          <span className={`group-hover:${color}`}>{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="inline-block">
      <button ref={btnRef} onClick={handleToggle} disabled={isBusy}
        className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-slate-400/15 transition-colors duration-150 ${open ? 'bg-white/5' : 'bg-transparent hover:bg-white/5'} ${isBusy ? 'text-slate-400/35 cursor-not-allowed' : 'text-slate-400 cursor-pointer'}`}
      >
        {isBusy
          ? <div className="w-3.5 h-3.5 border-2 border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.7s_linear_infinite]" />
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
        className={`border-b border-slate-400/[0.07] transition-colors hover:bg-slate-800/80 ${idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/25'}`}
      >
        {/* Recipient Name */}
        <td className="p-[13px_16px]">
          <span className="text-slate-200 font-semibold">{req.recipientName ?? "—"}</span>
        </td>

        {/* Location */}
        <td className="p-[13px_16px]">
          <div className="flex items-center gap-1.5 text-slate-400 text-[0.85rem]">
            <MapPin size={13} className="text-slate-500" />
            <span>{[req.recipientDistrict, req.recipientUpazila].filter(Boolean).join(", ") || "—"}</span>
          </div>
        </td>

        {/* Date & Time */}
        <td className="p-[13px_16px]">
          <div className="flex items-center gap-1.5 text-slate-400 text-[0.85rem] whitespace-nowrap">
            <CalendarDays size={13} className="text-slate-500" />
            {formatDate(req.donationDate)}
          </div>
          {req.donationTime && (
            <div className="flex items-center gap-1.5 text-slate-500 text-[0.75rem] mt-[3px]">
              <Clock size={11} />
              {req.donationTime}
            </div>
          )}
        </td>

        {/* Blood Group */}
        <td className="p-[13px_16px]">
          <BloodBadge group={req.bloodGroup ?? "—"} />
        </td>

        {/* Status */}
        <td className="p-[13px_16px]">
          <StatusBadge status={req.status ?? "pending"} />
        </td>

        {/* 3-dot Actions */}
        <td className="p-[13px_16px]">
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
        <tr className="bg-blue-500/5 border-b border-slate-400/[0.07]">
          <td colSpan={6} className="p-[10px_20px]">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-[0.72rem] font-bold text-blue-400 tracking-[0.06em] uppercase">
                Donor Info
              </span>
              {req.donorName && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[0.82rem]">
                  <User2 size={13} className="text-blue-400" />
                  <span className="text-slate-200 font-semibold">{req.donorName}</span>
                </div>
              )}
              {req.donorEmail && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[0.82rem]">
                  <Mail size={13} className="text-blue-400" />
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
    getMyDonationRequests(user.email)
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
      await updateDonationRequestStatus(id, newStatus);
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
      await deleteDonationRequest(id);
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
      <div className="flex items-center gap-3 text-slate-400 py-[60px] px-6">
        <div className="w-[22px] h-[22px] border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>Loading…</span>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="pt-1 pb-10 text-slate-100 min-h-full">
      <style>{`
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dropIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
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
      <div className="max-w-[900px] mx-auto mb-8 bg-[linear-gradient(135deg,rgba(239,68,68,0.12)_0%,rgba(15,23,42,0.6)_60%)] border border-red-500/20 rounded-[20px] p-8 backdrop-blur-[14px] animate-[fadeUp_0.4s_ease] relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(239,68,68,0.15),transparent_70%)] rounded-full pointer-events-none" />

        <div className="flex items-center gap-4 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-[3px] border-red-500/40 shadow-[0_0_24px_rgba(239,68,68,0.2)] shrink-0 overflow-hidden"
               style={{ background: user?.image ? "transparent" : `hsl(${(user?.name ?? "D").charCodeAt(0) * 13 % 360}, 55%, 38%)` }}>
            {user?.image
              ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-white text-2xl font-bold">
                  {(user?.name ?? "D").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} className="text-amber-400" />
              <span className="text-[0.8rem] text-amber-400 font-semibold tracking-[0.04em]">
                {greeting}
              </span>
            </div>
            <h1 className="m-0 text-[1.75rem] font-extrabold text-slate-100 tracking-[-0.03em] leading-[1.2]">
              {user?.name ?? "Donor"} 👋
            </h1>
            <p className="m-0 mt-1.5 text-slate-400 text-[0.88rem] leading-relaxed">
              Welcome to your donor dashboard. You can manage your donation requests and track their status here.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Total",      count: requests.length,                                       color: "text-slate-400" },
              { label: "Pending",    count: requests.filter((r) => r.status === "pending").length,    color: "text-amber-400" },
              { label: "In Progress",count: requests.filter((r) => r.status === "inprogress").length, color: "text-blue-400" },
              { label: "Done",       count: requests.filter((r) => r.status === "done").length,       color: "text-green-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center px-4 py-2.5 bg-slate-900/50 border border-slate-400/10 rounded-xl min-w-[68px]">
                <div className={`text-[1.4rem] font-extrabold leading-none ${color}`}>{count}</div>
                <div className="text-[0.68rem] text-slate-500 font-semibold mt-1 whitespace-nowrap">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Requests Section ──────────────────────────────────────────── */}
      {(loading || recent.length > 0) && (
        <div className="max-w-[900px] mx-auto animate-[fadeUp_0.5s_ease_0.1s_both]">

          {/* Section header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[linear-gradient(135deg,rgba(239,68,68,0.25),rgba(220,38,38,0.15))] border border-red-500/30 flex items-center justify-center">
                <Droplets size={17} className="text-red-400" />
              </div>
              <div>
                <h2 className="m-0 text-[1.1rem] font-bold text-slate-100">
                  Recent Donation Requests
                </h2>
                <p className="m-0 text-slate-500 text-[0.78rem]">
                  Your 3 most recent requests
                </p>
              </div>
            </div>

            <Link href="/dashboard/my-donation-requests" 
                  className="inline-flex items-center gap-1.5 px-[18px] py-2 rounded-[10px] bg-red-500/15 border border-red-500/35 text-red-400 text-[0.82rem] font-bold no-underline transition-colors hover:bg-red-500/25">
              View All Requests <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card */}
          <div className="bg-slate-900/70 border border-slate-400/10 rounded-[18px] backdrop-blur-md overflow-hidden">
            {/* Top accent */}
            <div className="h-[3px] bg-[linear-gradient(90deg,#ef4444,#dc2626,#b91c1c)]" />

            {/* Loading skeleton */}
            {loading ? (
              <div className="py-12 px-6 flex flex-col items-center gap-3.5 text-slate-400">
                <div className="w-8 h-8 border-[3px] border-slate-400/15 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
                <span className="text-[0.9rem]">Loading requests…</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[780px] text-[0.875rem]">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-400/10">
                      {["Recipient Name", "Location", "Date & Time", "Blood Group", "Status", "Actions"].map((h) => (
                        <th key={h} className="p-[13px_16px] text-left text-slate-500 font-semibold text-[0.72rem] tracking-[0.06em] uppercase whitespace-nowrap">
                          {h}
                        </th>
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
              <div className="p-[14px_20px] border-t border-slate-400/[0.08] flex justify-center">
                <Link href="/dashboard/my-donation-requests" 
                      className="inline-flex items-center gap-1.5 text-red-400 text-[0.83rem] font-semibold no-underline">
                  See all {requests.length} requests <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state (no requests yet) ───────────────────────────────────── */}
      {!loading && recent.length === 0 && (
        <div className="max-w-[900px] mx-auto animate-[fadeUp_0.5s_ease_0.15s_both]">
          <div className="bg-slate-900/50 border border-slate-400/10 rounded-[18px] p-[52px_32px] text-center backdrop-blur-md">
            <div className="w-15 h-15 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4.5">
              <Droplets size={26} className="text-red-500/50" />
            </div>
            <h3 className="m-0 mb-2 text-[1.1rem] font-bold text-slate-100">
              No Donation Requests Yet
            </h3>
            <p className="m-0 mb-6 text-slate-500 text-[0.875rem] leading-relaxed">
              You haven't made any donation requests. Create your first request to find a blood donor.
            </p>
            <Link href="/dashboard/create-donation-request" 
                  className="inline-flex items-center gap-2 px-6 py-[11px] rounded-[10px] bg-red-500/20 border border-red-500/40 text-red-400 text-[0.9rem] font-bold no-underline transition-colors hover:bg-red-500/30">
              <Droplets size={16} /> Create Donation Request
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}