"use client";

import { useState, useEffect } from "react";
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

const inputBase = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  fontSize: "0.9rem",
  fontWeight: 500,
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const inputReadonly = {
  ...inputBase,
  background: "rgba(15,23,42,0.5)",
  border: "1px solid rgba(148,163,184,0.1)",
  color: "#64748b",
  cursor: "default",
};

const inputEditable = {
  ...inputBase,
  background: "rgba(15,23,42,0.8)",
  border: "1px solid rgba(148,163,184,0.22)",
  color: "#f1f5f9",
};

const selectEditable = {
  ...inputEditable,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
};

const selectDisabled = {
  ...inputBase,
  background: "rgba(15,23,42,0.4)",
  border: "1px solid rgba(148,163,184,0.08)",
  color: "#475569",
  cursor: "not-allowed",
  appearance: "none",
  WebkitAppearance: "none",
};

// ── Field wrapper ────────────────────────────────────────────────────────────

function Field({ icon: Icon, label, children, fullWidth = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: "0.73rem", fontWeight: 700, color: "#64748b",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
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
    <div style={{ position: "relative" }}>
      {children}
      <span style={{
        position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: disabled ? "#334155" : "#64748b", fontSize: 12,
      }}>▾</span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CreateDonationRequestPage() {
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", padding: "60px 24px" }}>
        <div style={{ width: 22, height: 22, border: "2.5px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>{loadingEdit ? "Loading request data…" : "Loading…"}</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <p style={{ color: "#f87171", padding: 24 }}>Not authenticated.</p>;
  }

  // ── Blocked user guard ───────────────────────────────────────────────────────

  if (user.status === "blocked") {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 20px" }}>
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 18,
          padding: "44px 36px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <AlertTriangle size={30} color="#f87171" />
          </div>
          <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem", fontWeight: 700, color: "#f87171" }}>
            Account Blocked
          </h2>
          <p style={{ margin: "0 0 24px", color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Your account has been blocked. You cannot create a donation request at this time.
            Please contact the administrator for assistance.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer",
            }}
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
      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 20px" }}>
        <div style={{
          background: "rgba(34,197,94,0.07)",
          border: "1px solid rgba(34,197,94,0.28)",
          borderRadius: 18,
          padding: "48px 36px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "rgba(34,197,94,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 22px",
            boxShadow: "0 0 30px rgba(34,197,94,0.2)",
          }}>
            <CheckCircle2 size={34} color="#4ade80" />
          </div>
          <h2 style={{ margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 700, color: "#4ade80" }}>
            {isEditMode ? "Request Updated!" : "Request Submitted!"}
          </h2>
          <p style={{ margin: "0 0 28px", color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.65 }}>
            {isEditMode
              ? "Your donation request has been updated successfully."
              : <>Your blood donation request has been submitted successfully and is now <strong style={{ color: "#fbbf24" }}>pending</strong>. A donor will reach out soon.</>}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {!isEditMode && (
              <button
                onClick={() => {
                  setSuccess(false);
                  setRecipientName(""); setRecipientDistrict(""); setRecipientUpazila("");
                  setHospitalName(""); setFullAddress(""); setBloodGroup("");
                  setDonationDate(""); setDonationTime(""); setRequestMessage("");
                  setFilteredUpazilas([]);
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 10,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#f87171", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                }}
              >
                <Send size={14} /> Create Another
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard/my-donation-requests")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(148,163,184,0.18)",
                color: "#e2e8f0", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              }}
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
    <div style={{ padding: "4px 0 40px", minHeight: "100%", color: "#f1f5f9" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dr-input:focus {
          border-color: rgba(239,68,68,0.55) !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .dr-input::placeholder { color: #475569; }
        .dr-select option { background: #0f172a; color: #f1f5f9; }
        .dr-btn-submit:hover:not(:disabled) {
          background: rgba(239,68,68,0.28) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(239,68,68,0.25);
        }
        .dr-btn-submit:active:not(:disabled) { transform: translateY(0); }
        textarea.dr-input { resize: vertical; min-height: 110px; }
      `}</style>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, maxWidth: 820, margin: "0 auto 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isEditMode ? <Pencil size={18} color="#f87171" /> : <Droplets size={20} color="#f87171" />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              {isEditMode ? "Edit Donation Request" : "Create Donation Request"}
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.83rem", marginTop: 2 }}>
              {isEditMode
                ? "Update the details of your donation request below."
                : "Fill in the details below to post a blood donation request."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 820,
        margin: "0 auto",
        background: "rgba(15,23,42,0.65)",
        border: "1px solid rgba(148,163,184,0.1)",
        borderRadius: 20,
        backdropFilter: "blur(14px)",
        overflow: "hidden",
      }}>

        {/* Card header band */}
        <div style={{
          height: 5,
          background: "linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)",
        }} />

        {/* Section: Requester Info */}
        <div style={{ padding: "28px 28px 0" }}>
          <p style={{
            margin: "0 0 18px",
            fontSize: "0.78rem", fontWeight: 700, color: "#ef4444",
            letterSpacing: "0.08em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ display: "inline-block", width: 18, height: 1, background: "#ef4444", verticalAlign: "middle" }} />
            Requester Information
            <span style={{ display: "inline-block", width: 18, height: 1, background: "#ef4444", verticalAlign: "middle" }} />
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 28 }}>
            <Field icon={User} label="Requester Name">
              <div style={{ position: "relative" }}>
                <input
                  value={user.name}
                  readOnly
                  style={{ ...inputReadonly, paddingRight: 66 }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.67rem", color: "#475569", fontWeight: 700, letterSpacing: "0.04em" }}>
                  READ ONLY
                </span>
              </div>
            </Field>
            <Field icon={Mail} label="Requester Email">
              <div style={{ position: "relative" }}>
                <input
                  value={user.email}
                  readOnly
                  style={{ ...inputReadonly, paddingRight: 66 }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.67rem", color: "#475569", fontWeight: 700, letterSpacing: "0.04em" }}>
                  READ ONLY
                </span>
              </div>
            </Field>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(148,163,184,0.08)", margin: "0 0 24px" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "0 28px 32px" }}>

          {/* Section: Recipient Info */}
          <p style={{
            margin: "0 0 18px",
            fontSize: "0.78rem", fontWeight: 700, color: "#ef4444",
            letterSpacing: "0.08em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ display: "inline-block", width: 18, height: 1, background: "#ef4444", verticalAlign: "middle" }} />
            Recipient Information
            <span style={{ display: "inline-block", width: 18, height: 1, background: "#ef4444", verticalAlign: "middle" }} />
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>

            {/* Recipient Name */}
            <Field icon={User} label="Recipient Name">
              <input
                id="recipientName"
                type="text"
                placeholder="Patient's full name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="dr-input"
                style={inputEditable}
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
                  className="dr-input dr-select"
                  style={selectEditable}
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
                  className="dr-input dr-select"
                  style={selectEditable}
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
                  className="dr-input dr-select"
                  style={recipientDistrict ? selectEditable : selectDisabled}
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
                className="dr-input"
                style={inputEditable}
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
                className="dr-input"
                style={inputEditable}
              />
            </Field>

            {/* Donation Date */}
            <Field icon={CalendarDays} label="Donation Date">
              <input
                id="donationDate"
                type="date"
                min={today}
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                required
                className="dr-input"
                style={{ ...inputEditable, colorScheme: "dark" }}
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
                className="dr-input"
                style={{ ...inputEditable, colorScheme: "dark" }}
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
                className="dr-input"
                style={{ ...inputEditable, resize: "vertical", minHeight: 120, lineHeight: 1.6 }}
              />
            </Field>

          </div>

          {/* ── Status badge info ─────────────────────────────────────────── */}
          <div style={{
            marginTop: 22,
            padding: "10px 16px",
            borderRadius: 10,
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.22)",
            display: "flex", alignItems: "center", gap: 10,
            fontSize: "0.82rem", color: "#fbbf24",
          }}>
            <span style={{ fontSize: "1rem" }}>⏳</span>
            <span>
              Your request will be created with status{" "}
              <strong style={{ background: "rgba(251,191,36,0.15)", padding: "1px 8px", borderRadius: 6, border: "1px solid rgba(251,191,36,0.3)" }}>
                Pending
              </strong>
              {" "}and will be visible to potential donors.
            </span>
          </div>

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <div style={{
              marginTop: 18,
              padding: "11px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              fontSize: "0.86rem",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          {/* ── Submit button ──────────────────────────────────────────────── */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={submitting}
              className="dr-btn-submit"
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                padding: "13px 32px",
                borderRadius: 12,
                background: submitting ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.45)",
                color: "#f87171",
                fontSize: "0.95rem", fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.75 : 1,
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              {submitting ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2.5px solid rgba(248,113,113,0.25)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
