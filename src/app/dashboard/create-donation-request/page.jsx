"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getDistricts, getUpazilas } from "@/lib/Api/district";
import {
  User, Mail, MapPin, MapPinned, Building2, Droplets,
  CalendarDays, Clock, MessageSquare, Send, AlertTriangle,
  CheckCircle2, Home, Pencil,
} from "lucide-react";

// ── Static data ──────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ── Shared styles ────────────────────────────────────────────────────────────

const inputBaseClasses = "w-full px-3.5 py-2.5 rounded-[10px] text-[0.9rem] font-medium outline-none transition-all duration-150 box-border font-sans";

const inputReadonlyClasses = `${inputBaseClasses} bg-slate-900/50 border border-slate-400/10 text-slate-500 cursor-default`;

const inputEditableClasses = `${inputBaseClasses} bg-slate-900/80 border border-slate-400/20 text-slate-100 focus:border-red-500/50 focus:ring-[3px] focus:ring-red-500/10 placeholder:text-slate-600`;

const selectEditableClasses = `${inputEditableClasses} appearance-none cursor-pointer`;

const selectDisabledClasses = `${inputBaseClasses} bg-slate-900/40 border border-slate-400/10 text-slate-600 cursor-not-allowed appearance-none`;

// ── Field wrapper ────────────────────────────────────────────────────────────

function Field({ icon: Icon, label, children, fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'col-span-full' : ''}`}>
      <label className="flex items-center gap-1.5 text-[0.73rem] font-bold text-slate-500 tracking-[0.06em] uppercase">
        <Icon size={12} />
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Select wrapper with chevron ──────────────────────────────────────────────

function SelectWrap({ children, disabled }) {
  return (
    <div className="relative">
      {children}
      <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${disabled ? 'text-slate-700' : 'text-slate-500'}`}>
        ▾
      </span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function CreateDonationRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); // present when editing
  const isEditMode = !!editId;

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  // Location data
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [filteredUpazilas, setFilteredUpazilas] = useState([]);

  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [recipientDistrict, setRecipientDistrict] = useState("");
  const [recipientUpazila, setRecipientUpazila] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [donationDate, setDonationDate] = useState("");
  const [donationTime, setDonationTime] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);

  // Fetch districts & upazilas
  useEffect(() => {
    Promise.all([getDistricts(), getUpazilas()])
      .then(([rawD, rawU]) => {
        const d = Array.isArray(rawD) ? (rawD[2]?.data ?? rawD) : [];
        const u = Array.isArray(rawU) ? (rawU[2]?.data ?? rawU) : [];
        setDistricts(d);
        setUpazilas(u);
      })
      .catch(() => {});
  }, []);

  // Pre-fill form when editing (runs after districts/upazilas are loaded)
  useEffect(() => {
    if (!editId || !districts.length || !upazilas.length) return;
    setLoadingEdit(true);
    fetch(`${BASE_URL}/donation-requests/${editId}`)
      .then((r) => r.json())
      .then((data) => {
        setRecipientName(data.recipientName ?? "");
        setBloodGroup(data.bloodGroup ?? "");
        setHospitalName(data.hospitalName ?? "");
        setFullAddress(data.fullAddress ?? "");
        setDonationDate(data.donationDate ?? "");
        setDonationTime(data.donationTime ?? "");
        setRequestMessage(data.requestMessage ?? "");
        // Set district and filter upazilas
        const districtName = data.recipientDistrict ?? "";
        setRecipientDistrict(districtName);
        const found = districts.find((d) => d.name === districtName);
        if (found) {
          const filtered = upazilas.filter((u) => String(u.district_id) === String(found.id));
          setFilteredUpazilas(filtered);
        }
        setRecipientUpazila(data.recipientUpazila ?? "");
      })
      .catch(() => setError("Failed to load request data."))
      .finally(() => setLoadingEdit(false));
  }, [editId, districts, upazilas]);

  // Filter upazilas when district changes
  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setRecipientDistrict(val);
    setRecipientUpazila("");
    const found = districts.find((d) => d.name === val);
    if (found) {
      setFilteredUpazilas(upazilas.filter((u) => String(u.district_id) === String(found.id)));
    } else {
      setFilteredUpazilas([]);
    }
  };

  // Submit handler (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!recipientName.trim() || !recipientDistrict || !recipientUpazila ||
        !hospitalName.trim() || !fullAddress.trim() || !bloodGroup ||
        !donationDate || !donationTime || !requestMessage.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        recipientName: recipientName.trim(),
        recipientDistrict,
        recipientUpazila,
        hospitalName: hospitalName.trim(),
        fullAddress: fullAddress.trim(),
        bloodGroup,
        donationDate,
        donationTime,
        requestMessage: requestMessage.trim(),
      };

      const url = isEditMode
        ? `${BASE_URL}/donation-requests/${editId}`
        : `${BASE_URL}/donation-requests`;

      const method = isEditMode ? "PATCH" : "POST";

      if (!isEditMode) {
        // Only set these on creation
        payload.requesterName  = user.name;
        payload.requesterEmail = user.email;
        payload.requesterId    = user.id;
        payload.status         = "pending";
        payload.createdAt      = new Date().toISOString();
      }

      const { data: token } = await authClient.token();
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token?.token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || (isEditMode ? "Failed to update request." : "Failed to create request."));
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isPending || loadingEdit) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-[60px] px-6">
        <div className="w-[22px] h-[22px] border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>{loadingEdit ? "Loading request data…" : "Loading…"}</span>
      </div>
    );
  }

  if (!user) {
    return <p className="text-red-400 p-6">Not authenticated.</p>;
  }

  // ── Blocked user guard ───────────────────────────────────────────────────────

  if (user.status === "blocked") {
    return (
      <div className="max-w-[560px] mx-auto my-[60px] px-5">
        <div className="bg-red-500/10 border border-red-500/30 rounded-[18px] p-[44px_36px] text-center backdrop-blur-[10px]">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={30} className="text-red-400" />
          </div>
          <h2 className="m-0 mb-2.5 text-[1.25rem] font-bold text-red-400">
            Account Blocked
          </h2>
          <p className="m-0 mb-6 text-slate-400 text-[0.9rem] leading-relaxed">
            Your account has been blocked. You cannot create a donation request at this time.
            Please contact the administrator for assistance.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-[22px] py-2.5 rounded-[10px] bg-white/5 border border-slate-400/20 text-slate-200 text-[0.875rem] font-semibold cursor-pointer transition-colors hover:bg-white/10"
          >
            <Home size={15} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="max-w-[560px] mx-auto my-[60px] px-5">
        <div className="bg-green-500/10 border border-green-500/30 rounded-[18px] p-[48px_36px] text-center backdrop-blur-[10px]">
          <div className="w-[68px] h-[68px] rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5.5 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle2 size={34} className="text-green-400" />
          </div>
          <h2 className="m-0 mb-2.5 text-[1.3rem] font-bold text-green-400">
            {isEditMode ? "Request Updated!" : "Request Submitted!"}
          </h2>
          <p className="m-0 mb-7 text-slate-400 text-[0.9rem] leading-[1.65]">
            {isEditMode
              ? "Your donation request has been updated successfully."
              : <>Your blood donation request has been submitted successfully and is now <strong className="text-amber-400">pending</strong>. A donor will reach out soon.</>}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {!isEditMode && (
              <button
                onClick={() => {
                  setSuccess(false);
                  setRecipientName(""); setRecipientDistrict(""); setRecipientUpazila("");
                  setHospitalName(""); setFullAddress(""); setBloodGroup("");
                  setDonationDate(""); setDonationTime(""); setRequestMessage("");
                  setFilteredUpazilas([]);
                }}
                className="inline-flex items-center gap-2 px-[22px] py-2.5 rounded-[10px] bg-red-500/15 border border-red-500/40 text-red-400 text-[0.875rem] font-bold cursor-pointer transition-colors hover:bg-red-500/25"
              >
                <Send size={14} /> Create Another
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard/my-donation-requests")}
              className="inline-flex items-center gap-2 px-[22px] py-2.5 rounded-[10px] bg-white/5 border border-slate-400/20 text-slate-200 text-[0.875rem] font-semibold cursor-pointer transition-colors hover:bg-white/10"
            >
              <Home size={14} /> My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="pt-1 pb-10 min-h-full text-slate-100 font-sans">
      <style>{`
        .dr-select option { background: #0f172a; color: #f1f5f9; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
      `}</style>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="max-w-[820px] mx-auto mb-7">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-xl bg-[linear-gradient(135deg,rgba(239,68,68,0.25),rgba(220,38,38,0.15))] border border-red-500/30 flex items-center justify-center">
            {isEditMode ? <Pencil size={18} className="text-red-400" /> : <Droplets size={20} className="text-red-400" />}
          </div>
          <div>
            <h1 className="m-0 text-[1.5rem] font-bold text-slate-100 tracking-[-0.02em]">
              {isEditMode ? "Edit Donation Request" : "Create Donation Request"}
            </h1>
            <p className="m-0 mt-0.5 text-slate-500 text-[0.83rem]">
              {isEditMode
                ? "Update the details of your donation request below."
                : "Fill in the details below to post a blood donation request."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[820px] mx-auto bg-slate-900/65 border border-slate-400/10 rounded-[20px] backdrop-blur-[14px] overflow-hidden">

        {/* Card header band */}
        <div className="h-[5px] bg-[linear-gradient(90deg,#ef4444,#dc2626,#b91c1c)]" />

        {/* Section: Requester Info */}
        <div className="pt-7 px-7">
          <p className="m-0 mb-4.5 text-[0.78rem] font-bold text-red-500 tracking-[0.08em] uppercase flex items-center gap-1.5">
            <span className="inline-block w-[18px] h-px bg-red-500 align-middle" />
            Requester Information
            <span className="inline-block w-[18px] h-px bg-red-500 align-middle" />
          </p>
          <div className="grid grid-cols-2 gap-[16px_24px] mb-7">
            <Field icon={User} label="Requester Name">
              <div className="relative">
                <input
                  value={user.name}
                  readOnly
                  className={`${inputReadonlyClasses} pr-[66px]`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.67rem] text-slate-600 font-bold tracking-[0.04em]">
                  READ ONLY
                </span>
              </div>
            </Field>
            <Field icon={Mail} label="Requester Email">
              <div className="relative">
                <input
                  value={user.email}
                  readOnly
                  className={`${inputReadonlyClasses} pr-[66px]`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.67rem] text-slate-600 font-bold tracking-[0.04em]">
                  READ ONLY
                </span>
              </div>
            </Field>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-400/[0.08] mb-6" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 pb-8">

          {/* Section: Recipient Info */}
          <p className="m-0 mb-4.5 text-[0.78rem] font-bold text-red-500 tracking-[0.08em] uppercase flex items-center gap-1.5">
            <span className="inline-block w-[18px] h-px bg-red-500 align-middle" />
            Recipient Information
            <span className="inline-block w-[18px] h-px bg-red-500 align-middle" />
          </p>

          <div className="grid grid-cols-2 gap-[20px_24px]">

            {/* Recipient Name */}
            <Field icon={User} label="Recipient Name">
              <input
                id="recipientName"
                type="text"
                placeholder="Patient's full name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className={inputEditableClasses}
              />
            </Field>

            {/* Blood Group */}
            <Field icon={Droplets} label="Blood Group">
              <SelectWrap>
                <select
                  id="bloodGroup"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                  className={`dr-select ${selectEditableClasses}`}
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            {/* Recipient District */}
            <Field icon={MapPin} label="Recipient District">
              <SelectWrap>
                <select
                  id="recipientDistrict"
                  value={recipientDistrict}
                  onChange={handleDistrictChange}
                  required
                  className={`dr-select ${selectEditableClasses}`}
                >
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={String(d.id)} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            {/* Recipient Upazila */}
            <Field icon={MapPinned} label="Recipient Upazila">
              <SelectWrap disabled={!recipientDistrict}>
                <select
                  id="recipientUpazila"
                  value={recipientUpazila}
                  onChange={(e) => setRecipientUpazila(e.target.value)}
                  disabled={!recipientDistrict}
                  required
                  className={`dr-select ${recipientDistrict ? selectEditableClasses : selectDisabledClasses}`}
                >
                  <option value="">{recipientDistrict ? "Select upazila" : "Select district first"}</option>
                  {filteredUpazilas.map((u) => (
                    <option key={String(u.id)} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </SelectWrap>
            </Field>

            {/* Hospital Name */}
            <Field icon={Building2} label="Hospital Name">
              <input
                id="hospitalName"
                type="text"
                placeholder="e.g. Dhaka Medical College Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
                className={inputEditableClasses}
              />
            </Field>

            {/* Full Address */}
            <Field icon={Home} label="Full Address Line">
              <input
                id="fullAddress"
                type="text"
                placeholder="e.g. Zahir Raihan Rd, Dhaka"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                required
                className={inputEditableClasses}
              />
            </Field>

            {/* Donation Date */}
            <Field icon={CalendarDays} label="Donation Date">
              <input
                suppressHydrationWarning
                id="donationDate"
                type="date"
                min={today}
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                required
                className={inputEditableClasses}
                style={{ colorScheme: "dark" }}
              />
            </Field>

            {/* Donation Time */}
            <Field icon={Clock} label="Donation Time">
              <input
                id="donationTime"
                type="time"
                value={donationTime}
                onChange={(e) => setDonationTime(e.target.value)}
                required
                className={inputEditableClasses}
                style={{ colorScheme: "dark" }}
              />
            </Field>

            {/* Request Message — full width */}
            <Field icon={MessageSquare} label="Request Message" fullWidth>
              <textarea
                id="requestMessage"
                placeholder="Describe why blood is urgently needed, patient condition, any special notes for the donor…"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                required
                rows={5}
                className={`resize-y min-h-[120px] leading-[1.6] ${inputEditableClasses}`}
              />
            </Field>

          </div>

          {/* ── Status badge info ─────────────────────────────────────────── */}
          <div className="mt-5.5 px-4 py-2.5 rounded-[10px] bg-amber-400/10 border border-amber-400/20 flex items-center gap-2.5 text-[0.82rem] text-amber-400">
            <span className="text-base">⏳</span>
            <span>
              Your request will be created with status{" "}
              <strong className="bg-amber-400/15 px-2 py-0.5 rounded-md border border-amber-400/30 font-bold">
                Pending
              </strong>
              {" "}and will be visible to potential donors.
            </span>
          </div>

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <div className="mt-4.5 px-4 py-2.5 rounded-[10px] bg-red-500/10 border border-red-500/30 text-red-400 text-[0.86rem] flex items-center gap-2">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          {/* ── Submit button ──────────────────────────────────────────────── */}
          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl border text-[0.95rem] font-bold tracking-[0.02em] transition-all duration-200 ${submitting ? 'bg-red-500/10 border-red-500/45 text-red-400 opacity-75 cursor-not-allowed' : 'bg-red-500/20 border-red-500/45 text-red-400 cursor-pointer hover:bg-red-500/30 hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(239,68,68,0.25)] active:translate-y-0'}`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-[2.5px] border-red-400/25 border-t-red-400 rounded-full animate-[spin_0.7s_linear_infinite]" />
                  {isEditMode ? "Saving…" : "Submitting…"}
                </>
              ) : (
                <>
                  {isEditMode ? <Pencil size={16} /> : <Send size={16} />}
                  {isEditMode ? "Save Changes" : "Submit Request"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateDonationRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-3 text-slate-400 py-[60px] px-6">
        <div className="w-[22px] h-[22px] border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>Loading…</span>
      </div>
    }>
      <CreateDonationRequestContent />
    </Suspense>
  );
}
