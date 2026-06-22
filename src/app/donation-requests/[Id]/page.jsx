"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { createPortal } from "react-dom";
import {
  Droplets, MapPin, MapPinned, Building2, Home,
  CalendarDays, Clock, MessageSquare, User,
  Mail, AlertTriangle, CheckCircle2, ArrowLeft,
  Heart, Loader2,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const BLOOD_COLORS = {
  "A+": "#f87171", "A-": "#fca5a5",
  "B+": "#fb923c", "B-": "#fdba74",
  "AB+": "#c084fc", "AB-": "#d8b4fe",
  "O+": "#f472b6", "O-": "#f9a8d4",
};

const STATUS_COLORS = {
  pending:    { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.35)",  label: "Pending"     },
  inprogress: { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.35)",  label: "In Progress" },
  done:       { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", border: "rgba(34,197,94,0.3)",    label: "Done"        },
  canceled:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.3)",    label: "Canceled"    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return d; }
}

// ── Detail Row ────────────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "14px 0",
      borderBottom: "1px solid rgba(148,163,184,0.07)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: accent ? `${accent}18` : "rgba(148,163,184,0.08)",
        border: `1px solid ${accent ? `${accent}33` : "rgba(148,163,184,0.12)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} color={accent ?? "#64748b"} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>
          {label}
        </p>
        <p style={{ margin: 0, color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ── Donate Modal ──────────────────────────────────────────────────────────────

function DonateModal({ user, onConfirm, onCancel, loading, success }) {
  const modal = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "linear-gradient(145deg, #0f172a, #111827)",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 22, padding: "36px 32px",
        maxWidth: 460, width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        animation: "fadeUp 0.2s ease",
      }}>
        {success ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 0 30px rgba(34,197,94,0.2)",
            }}>
              <CheckCircle2 size={30} color="#4ade80" />
            </div>
            <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem", fontWeight: 800, color: "#4ade80" }}>
              Thank You! 🩸
            </h3>
            <p style={{ margin: "0 0 24px", color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Your donation has been confirmed. The requester will be notified shortly.
            </p>
            <button onClick={onCancel} style={{
              padding: "10px 28px", borderRadius: 10,
              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)",
              color: "#4ade80", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
            }}>
              Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 24px rgba(239,68,68,0.15)",
              }}>
                <Heart size={22} color="#f87171" fill="rgba(239,68,68,0.3)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#f1f5f9" }}>
                  Confirm Your Donation
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem", marginTop: 2 }}>
                  Your info will be shared with the requester.
                </p>
              </div>
            </div>

            {/* Donor name (read-only) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>
                Your Name
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 10,
                background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.12)",
              }}>
                <User size={15} color="#64748b" />
                <span style={{ color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 500 }}>{user?.name ?? "—"}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#64748b", background: "rgba(148,163,184,0.08)", borderRadius: 6, padding: "2px 8px" }}>read-only</span>
              </div>
            </div>

            {/* Donor email (read-only) */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>
                Your Email
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 10,
                background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.12)",
              }}>
                <Mail size={15} color="#64748b" />
                <span style={{ color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 500 }}>{user?.email ?? "—"}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#64748b", background: "rgba(148,163,184,0.08)", borderRadius: 6, padding: "2px 8px" }}>read-only</span>
              </div>
            </div>

            {/* Notice */}
            <div style={{
              display: "flex", gap: 10, padding: "12px 14px",
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 10, marginBottom: 22,
            }}>
              <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.5 }}>
                By confirming, the request status will change to <strong style={{ color: "#60a5fa" }}>In Progress</strong>. You are committing to donate blood to the recipient.
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onCancel} disabled={loading} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.18)", background: "rgba(255,255,255,0.04)",
                color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading} style={{
                flex: 2, padding: "11px 0", borderRadius: 10,
                border: "1px solid rgba(239,68,68,0.45)", background: "rgba(239,68,68,0.18)",
                color: "#f87171", fontSize: "0.875rem", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.7 : 1, transition: "all 0.18s",
              }}>
                {loading ? (
                  <><div style={{ width: 14, height: 14, border: "2px solid rgba(248,113,113,0.3)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Confirming…</>
                ) : (
                  <><Heart size={15} fill="rgba(239,68,68,0.4)" /> Confirm Donation</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DonationRequestDetailsPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params?.Id;

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = session?.user;

  const [request, setRequest]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Auth guard — redirect to login if not signed in ───────────────────────
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace(`/login?redirect=/donation-requests/${id}`);
    }
  }, [sessionLoading, user, id]);

  // ── Fetch request details ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    fetch(`${BASE_URL}/donation-requests/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => setRequest(data))
      .catch(() => setError("Donation request not found or could not be loaded."))
      .finally(() => setLoading(false));
  }, [id, user]);

  // ── Confirm donation ───────────────────────────────────────────────────────
  const handleConfirmDonate = async () => {
    if (!user || !request) return;
    setConfirming(true);
    try {
      const res = await fetch(`${BASE_URL}/donation-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "inprogress",
          donorName:  user.name,
          donorEmail: user.email,
          donorId:    user.id,
        }),
      });
      if (!res.ok) throw new Error();
      setRequest((prev) => ({ ...prev, status: "inprogress", donorName: user.name, donorEmail: user.email }));
      setDonateSuccess(true);
    } catch {
      alert("Failed to confirm donation. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // ── Loading/auth spinner ───────────────────────────────────────────────────
  if (sessionLoading || (!user && !sessionLoading)) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", padding: "80px 24px", justifyContent: "center", minHeight: "60vh", background: "#0a0f1e" }}>
        <div style={{ width: 24, height: 24, border: "2.5px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Verifying access…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const bloodColor = BLOOD_COLORS[request?.bloodGroup] ?? "#f87171";
  const statusInfo = STATUS_COLORS[request?.status] ?? STATUS_COLORS.pending;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1526 50%, #0a0f1e 100%)",
      padding: "40px 20px 60px",
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Modal */}
      {mounted && showModal && (
        <DonateModal
          user={user}
          loading={confirming}
          success={donateSuccess}
          onConfirm={handleConfirmDonate}
          onCancel={() => { setShowModal(false); setDonateSuccess(false); }}
        />
      )}

      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            marginBottom: 24, padding: "8px 16px", borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.15)", background: "rgba(255,255,255,0.04)",
            color: "#94a3b8", fontSize: "0.83rem", fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e2e8f0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ width: 36, height: 36, border: "3px solid rgba(148,163,184,0.15)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span>Loading details…</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 16, padding: "40px 32px", textAlign: "center",
          }}>
            <AlertTriangle size={32} color="#f87171" style={{ marginBottom: 14 }} />
            <h3 style={{ margin: "0 0 8px", color: "#f87171", fontWeight: 700 }}>Not Found</h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>{error}</p>
          </div>
        )}

        {/* ── Details ── */}
        {!loading && !error && request && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* ── Header Card ── */}
            <div style={{
              background: "rgba(15,23,42,0.8)",
              border: `1px solid ${bloodColor}33`,
              borderRadius: 20, overflow: "hidden",
              backdropFilter: "blur(14px)",
              marginBottom: 20,
              boxShadow: `0 0 40px ${bloodColor}15`,
            }}>
              {/* Top accent */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${bloodColor}, ${bloodColor}66)` }} />

              <div style={{ padding: "28px 28px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
                  {/* Blood group */}
                  <span style={{
                    background: `${bloodColor}1a`, color: bloodColor,
                    border: `1px solid ${bloodColor}55`,
                    borderRadius: 12, padding: "8px 20px",
                    fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.04em",
                  }}>
                    {request.bloodGroup ?? "—"}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    background: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}`,
                    borderRadius: 9999, padding: "6px 16px",
                    fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em",
                  }}>
                    {statusInfo.label}
                  </span>
                </div>

                <h1 style={{ margin: "14px 0 4px", fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                  {request.recipientName}
                </h1>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
                  Blood donation request · Created {new Date(request.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* ── Details Card ── */}
            <div style={{
              background: "rgba(15,23,42,0.75)",
              border: "1px solid rgba(148,163,184,0.1)",
              borderRadius: 20, padding: "8px 24px 4px",
              backdropFilter: "blur(12px)",
              marginBottom: 16,
            }}>
              <DetailRow icon={MapPin}       label="District"       value={request.recipientDistrict}  accent="#60a5fa" />
              <DetailRow icon={MapPinned}    label="Upazila"        value={request.recipientUpazila}   accent="#60a5fa" />
              <DetailRow icon={Building2}    label="Hospital"       value={request.hospitalName}        accent="#a78bfa" />
              <DetailRow icon={Home}         label="Full Address"   value={request.fullAddress}         accent="#a78bfa" />
              <DetailRow icon={CalendarDays} label="Donation Date"  value={formatDate(request.donationDate)} accent="#fbbf24" />
              <DetailRow icon={Clock}        label="Donation Time"  value={request.donationTime ?? "—"}  accent="#fbbf24" />
            </div>

            {/* ── Requester Card ── */}
            <div style={{
              background: "rgba(15,23,42,0.75)",
              border: "1px solid rgba(148,163,184,0.1)",
              borderRadius: 20, padding: "8px 24px 4px",
              backdropFilter: "blur(12px)",
              marginBottom: 16,
            }}>
              <DetailRow icon={User}  label="Requested By"    value={request.requesterName}  accent="#4ade80" />
              <DetailRow icon={Mail}  label="Requester Email" value={request.requesterEmail} accent="#4ade80" />
            </div>

            {/* ── Message Card ── */}
            {request.requestMessage && (
              <div style={{
                background: "rgba(15,23,42,0.75)",
                border: "1px solid rgba(148,163,184,0.1)",
                borderRadius: 20, padding: "8px 24px 4px",
                backdropFilter: "blur(12px)",
                marginBottom: 20,
              }}>
                <DetailRow icon={MessageSquare} label="Request Message" value={request.requestMessage} accent="#f87171" />
              </div>
            )}

            {/* ── Donor Info (when inprogress) ── */}
            {request.status === "inprogress" && request.donorName && (
              <div style={{
                background: "rgba(59,130,246,0.07)",
                border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: 20, padding: "8px 24px 4px",
                backdropFilter: "blur(12px)",
                marginBottom: 20,
              }}>
                <p style={{ margin: "14px 0 4px", fontSize: "0.72rem", color: "#60a5fa", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Donor Information
                </p>
                <DetailRow icon={User} label="Donor Name"  value={request.donorName}  accent="#60a5fa" />
                <DetailRow icon={Mail} label="Donor Email" value={request.donorEmail} accent="#60a5fa" />
              </div>
            )}

            {/* ── Donate Button ── */}
            {request.status === "pending" && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  width: "100%", padding: "16px 0", borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.18))",
                  border: "1px solid rgba(239,68,68,0.45)",
                  color: "#f87171", fontSize: "1rem", fontWeight: 800,
                  cursor: "pointer", letterSpacing: "0.02em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "all 0.2s ease",
                  boxShadow: "0 0 30px rgba(239,68,68,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.35), rgba(220,38,38,0.28))";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(239,68,68,0.2)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.18))";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(239,68,68,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Heart size={20} fill="rgba(239,68,68,0.35)" />
                I Want to Donate Blood
              </button>
            )}

            {/* Status messages for non-pending */}
            {request.status !== "pending" && (
              <div style={{
                padding: "16px 20px", borderRadius: 14, textAlign: "center",
                background: `${statusInfo.bg}`, border: `1px solid ${statusInfo.border}`,
                color: statusInfo.text, fontSize: "0.9rem", fontWeight: 600,
              }}>
                This request is currently <strong>{statusInfo.label}</strong> — no longer accepting donors.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}