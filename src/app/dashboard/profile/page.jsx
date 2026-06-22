"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { imageUpload } from "@/lib/imageupload";
import { updateUserProfile } from "@/lib/Api/all-users";
import { getDistricts, getUpazilas } from "@/lib/Api/district";
import { Pencil, Save, X, Camera, User, Mail, Droplets, MapPin, MapPinned, ShieldCheck } from "lucide-react";

// ── Static data ───────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ROLE_COLORS = {
  admin:     { text: "#a78bfa", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.35)" },
  volunteer: { text: "#4ade80", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)"   },
  donor:     { text: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)"  },
};

// ── Tiny shared field wrapper ─────────────────────────────────────────────────

function Field({ icon: Icon, label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        <Icon size={13} />
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────

const inputBase = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: "0.9rem",
  fontWeight: 500,
  outline: "none",
  transition: "border-color 0.18s, background 0.18s",
  boxSizing: "border-box",
};

const inputReadonly = {
  ...inputBase,
  background: "rgba(15,23,42,0.5)",
  border: "1px solid rgba(148,163,184,0.1)",
  color: "#94a3b8",
  cursor: "default",
};

const inputEditable = {
  ...inputBase,
  background: "rgba(15,23,42,0.8)",
  border: "1px solid rgba(148,163,184,0.25)",
  color: "#f1f5f9",
};

const selectStyle = (editable) => ({
  ...inputBase,
  background: editable ? "rgba(15,23,42,0.8)" : "rgba(15,23,42,0.5)",
  border: editable ? "1px solid rgba(148,163,184,0.25)" : "1px solid rgba(148,163,184,0.1)",
  color: editable ? "#f1f5f9" : "#94a3b8",
  cursor: editable ? "pointer" : "default",
  appearance: "none",
  WebkitAppearance: "none",
  pointerEvents: editable ? "auto" : "none",
});

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user;

  // Form state
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Field values
  const [name, setName]           = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict]   = useState("");
  const [upazila, setUpazila]     = useState("");

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const fileRef = useRef(null);

  // Location data
  const [districts, setDistricts]           = useState([]);
  const [upazilas, setUpazilas]             = useState([]);
  const [filteredUpazilas, setFilteredUpazilas] = useState([]);

  // Populate fields when session loads
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBloodGroup(user.bloodGroup ?? "");
      setDistrict(user.district ?? "");
      setUpazila(user.upazila ?? "");
    }
  }, [user]);

  // Fetch districts & upazilas using the shared API helper.
  // The JSON format is [{type:"header"},{type:"database"},{type:"table",data:[...]}]
  // so the actual rows live at index [2].data.
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

  // Re-filter upazilas when district changes
  useEffect(() => {
    if (!district || !districts.length || !upazilas.length) return;
    const found = districts.find((d) => d.name === district);
    if (found) {
      setFilteredUpazilas(upazilas.filter((u) => String(u.district_id) === String(found.id)));
    }
  }, [district, districts, upazilas]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setDistrict(val);
    setUpazila("");
    const found = districts.find((d) => d.name === val);
    if (found) {
      setFilteredUpazilas(upazilas.filter((u) => String(u.district_id) === String(found.id)));
    } else {
      setFilteredUpazilas([]);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleEdit = () => {
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  };

  const handleCancel = () => {
    // Reset to session values
    setName(user?.name ?? "");
    setBloodGroup(user?.bloodGroup ?? "");
    setDistrict(user?.district ?? "");
    setUpazila(user?.upazila ?? "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveError("");
    setEditing(false);
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);
    try {
      let imageUrl = user?.image ?? "";
      if (avatarFile) {
        const uploaded = await imageUpload(avatarFile);
        imageUrl = uploaded?.url ?? imageUrl;
      }

      await updateUserProfile(user.id, {
        name,
        image: imageUrl,
        bloodGroup,
        district,
        upazila,
      });

      // Also update better-auth session (name + image it knows about)
      await authClient.updateUser({ name, image: imageUrl });

      setSaveSuccess(true);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);

      // Refresh session so header/sidebar reflects new name/avatar
      if (typeof refetch === "function") refetch();
    } catch {
      setSaveError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar display ─────────────────────────────────────────────────────────

  const avatarSrc = avatarPreview ?? user?.image ?? null;
  const initials  = (user?.name ?? "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue       = (user?.name ?? "").charCodeAt(0) * 13 % 360;
  const roleColors = ROLE_COLORS[user?.role] ?? ROLE_COLORS.donor;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", padding: "60px 24px" }}>
        <div style={{ width: 22, height: 22, border: "2.5px solid rgba(148,163,184,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Loading profile…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <p style={{ color: "#f87171", padding: 24 }}>Not authenticated.</p>;
  }

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", background: "linear-gradient(135deg,#0a0f1e 0%,#0d1526 50%,#0a0f1e 100%)" }}>

      {/* Page title */}
      <div style={{ marginBottom: 28, maxWidth: 760, margin: "0 auto 28px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>
          My Profile
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: 4 }}>
          View and manage your personal information.
        </p>
      </div>

      {/* Card */}
      <div style={{
        maxWidth: 760,
        margin: "0 auto",
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(148,163,184,0.1)",
        borderRadius: 20,
        backdropFilter: "blur(12px)",
        overflow: "hidden",
      }}>

        {/* Card header band */}
        <div style={{ height: 80, background: "linear-gradient(90deg,rgba(239,68,68,0.25),rgba(139,92,246,0.18))", borderBottom: "1px solid rgba(148,163,184,0.08)" }} />

        {/* Avatar + top controls */}
        <div style={{ padding: "0 28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -44 }}>

          {/* Avatar */}
          <div style={{ position: "relative", display: "inline-block" }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid #0d1526", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: `hsl(${hue},55%,38%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.5rem", fontWeight: 700, border: "3px solid #0d1526", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                {initials}
              </div>
            )}

            {/* Camera overlay (edit mode only) */}
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                title="Change avatar"
                style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "#ef4444", border: "2px solid #0d1526", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
              >
                <Camera size={13} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          {/* Role badge + Edit/Save/Cancel buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 6 }}>
            <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: roleColors.text, background: roleColors.bg, border: `1px solid ${roleColors.border}` }}>
              {user.role ?? "donor"}
            </span>

            {!editing ? (
              <button onClick={handleEdit} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.2)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              >
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <button onClick={handleCancel} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.2)", background: "transparent", color: "#94a3b8", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: "0.83rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving
                    ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(248,113,113,0.3)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Saving…</>
                    : <><Save size={14} /> Save Changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name under avatar */}
        <div style={{ padding: "14px 28px 0" }}>
          <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#f1f5f9" }}>{user.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: "0.83rem", color: "#64748b" }}>{user.email}</p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(148,163,184,0.08)", margin: "20px 28px" }} />

        {/* Alerts */}
        <div style={{ padding: "0 28px" }}>
          {saveSuccess && (
            <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: "0.85rem", fontWeight: 500 }}>
              ✓ Profile updated successfully.
            </div>
          )}
          {saveError && (
            <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.85rem" }}>
              ⚠ {saveError}
            </div>
          )}
        </div>

        {/* Form grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px", padding: "0 28px 32px" }}>

          {/* Full Name */}
          <Field icon={User} label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editing}
              placeholder="Your name"
              style={editing ? inputEditable : inputReadonly}
            />
          </Field>

          {/* Email — always read-only */}
          <Field icon={Mail} label="Email Address">
            <div style={{ position: "relative" }}>
              <input
                value={user.email}
                disabled
                readOnly
                style={{ ...inputReadonly, paddingRight: 36 }}
              />
              <span title="Email cannot be changed" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "#475569", fontWeight: 600, letterSpacing: "0.04em" }}>
                LOCKED
              </span>
            </div>
          </Field>

          {/* Blood Group */}
          <Field icon={Droplets} label="Blood Group">
            {editing ? (
              <div style={{ position: "relative" }}>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  style={selectStyle(true)}
                >
                  {[
                    <option key="__bg" value="">Select blood group</option>,
                    ...BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    )),
                  ]}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: 12 }}>▾</span>
              </div>
            ) : (
              <input
                value={user.bloodGroup || "Not set"}
                readOnly
                style={inputReadonly}
              />
            )}
          </Field>

          {/* Role — display only */}
          <Field icon={ShieldCheck} label="Role">
            <input
              value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
              disabled
              readOnly
              style={inputReadonly}
            />
          </Field>

          {/* District */}
          <Field icon={MapPin} label="District">
            {editing ? (
              <div style={{ position: "relative" }}>
                <select
                  value={district}
                  onChange={handleDistrictChange}
                  style={selectStyle(true)}
                >
                  {[
                    <option key="__district" value="">Select district</option>,
                    ...districts.map((d) => (
                      <option key={String(d.id)} value={d.name}>{d.name}</option>
                    )),
                  ]}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: 12 }}>▾</span>
              </div>
            ) : (
              <input
                value={user.district || "Not set"}
                readOnly
                style={inputReadonly}
              />
            )}
          </Field>

          {/* Upazila */}
          <Field icon={MapPinned} label="Upazila">
            {editing ? (
              <div style={{ position: "relative" }}>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district}
                  style={selectStyle(!!district)}
                >
                  {[
                    <option key="__upazila" value="">Select upazila</option>,
                    ...filteredUpazilas.map((u) => (
                      <option key={String(u.id)} value={u.name}>{u.name}</option>
                    )),
                  ]}
                </select>
                {district && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: 12 }}>▾</span>
                )}
              </div>
            ) : (
              <input
                value={user.upazila || "Not set"}
                readOnly
                style={inputReadonly}
              />
            )}
          </Field>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}