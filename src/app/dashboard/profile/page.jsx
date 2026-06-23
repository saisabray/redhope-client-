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
  admin:     { text: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/35" },
  volunteer: { text: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/30"   },
  donor:     { text: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/30"  },
};

// ── Tiny shared field wrapper ─────────────────────────────────────────────────

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-slate-500 tracking-[0.05em] uppercase">
        <Icon size={13} />
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────

const inputBaseClasses = "w-full px-3.5 py-2.5 rounded-[10px] text-[0.9rem] font-medium outline-none transition-colors duration-150 box-border";

const inputReadonlyClasses = `${inputBaseClasses} bg-slate-900/50 border border-slate-400/10 text-slate-400 cursor-default`;

const inputEditableClasses = `${inputBaseClasses} bg-slate-900/80 border border-slate-400/25 text-slate-100 focus:border-red-500/50`;

const selectClasses = (editable) => 
  `${inputBaseClasses} appearance-none pointer-events-${editable ? 'auto' : 'none'} ${editable ? 'bg-slate-900/80 border-slate-400/25 text-slate-100 cursor-pointer focus:border-red-500/50' : 'bg-slate-900/50 border-slate-400/10 text-slate-400 cursor-default'} border`;

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
      <div className="flex items-center gap-3 text-slate-400 py-[60px] px-6">
        <div className="w-[22px] h-[22px] border-[2.5px] border-slate-400/20 border-t-red-500 rounded-full animate-[spin_0.8s_linear_infinite]" />
        <span>Loading profile…</span>
      </div>
    );
  }

  if (!user) {
    return <p className="text-red-400 p-6">Not authenticated.</p>;
  }

  return (
    <div className="min-h-screen py-8 px-6 bg-[linear-gradient(135deg,#0a0f1e_0%,#0d1526_50%,#0a0f1e_100%)]">

      {/* Page title */}
      <div className="max-w-[760px] mx-auto mb-7">
        <h1 className="m-0 text-[1.6rem] font-bold text-slate-100 tracking-[-0.02em]">
          My Profile
        </h1>
        <p className="m-0 mt-1 text-slate-500 text-[0.88rem]">
          View and manage your personal information.
        </p>
      </div>

      {/* Card */}
      <div className="max-w-[760px] mx-auto bg-slate-900/70 border border-slate-400/10 rounded-[20px] backdrop-blur-md overflow-hidden">

        {/* Card header band */}
        <div className="h-[80px] bg-[linear-gradient(90deg,rgba(239,68,68,0.25),rgba(139,92,246,0.18))] border-b border-slate-400/[0.08]" />

        {/* Avatar + top controls */}
        <div className="px-7 flex items-end justify-between -mt-[44px]">

          {/* Avatar */}
          <div className="relative inline-block">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} className="w-[88px] h-[88px] rounded-full object-cover border-[3px] border-[#0d1526] shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
            ) : (
              <div 
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white text-2xl font-bold border-[3px] border-[#0d1526] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                style={{ background: `hsl(${hue},55%,38%)` }}
              >
                {initials}
              </div>
            )}

            {/* Camera overlay (edit mode only) */}
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                title="Change avatar"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-red-500 border-2 border-[#0d1526] flex items-center justify-center cursor-pointer text-white hover:bg-red-600 transition-colors"
              >
                <Camera size={13} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Role badge + Edit/Save/Cancel buttons */}
          <div className="flex items-center gap-2.5 pb-1.5">
            <span className={`px-3 py-1 rounded-full text-[0.72rem] font-bold tracking-[0.05em] uppercase border ${roleColors.text} ${roleColors.bg} ${roleColors.border}`}>
              {user.role ?? "donor"}
            </span>

            {!editing ? (
              <button 
                onClick={handleEdit} 
                className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-slate-400/20 bg-white/5 text-slate-200 text-[0.83rem] font-semibold cursor-pointer transition-colors duration-150 hover:bg-white/10"
              >
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={handleCancel} 
                  disabled={saving} 
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-slate-400/20 bg-transparent text-slate-400 text-[0.83rem] font-semibold cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <X size={14} /> Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-red-500/40 bg-red-500/15 text-red-400 text-[0.83rem] font-bold transition-opacity ${saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-red-500/25'}`}
                >
                  {saving
                    ? <><div className="w-[13px] h-[13px] border-2 border-red-400/30 border-t-red-400 rounded-full animate-[spin_0.7s_linear_infinite]" /> Saving…</>
                    : <><Save size={14} /> Save Changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name under avatar */}
        <div className="px-7 pt-3.5">
          <p className="m-0 text-[1.15rem] font-bold text-slate-100">{user.name}</p>
          <p className="m-0 mt-0.5 text-[0.83rem] text-slate-500">{user.email}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-400/[0.08] my-5 mx-7" />

        {/* Alerts */}
        <div className="px-7">
          {saveSuccess && (
            <div className="mb-4 px-4 py-2.5 rounded-[10px] bg-green-500/10 border border-green-500/30 text-green-400 text-[0.85rem] font-medium">
              ✓ Profile updated successfully.
            </div>
          )}
          {saveError && (
            <div className="mb-4 px-4 py-2.5 rounded-[10px] bg-red-500/10 border border-red-500/30 text-red-400 text-[0.85rem]">
              ⚠ {saveError}
            </div>
          )}
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-[20px_24px] px-7 pb-8">

          {/* Full Name */}
          <Field icon={User} label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editing}
              placeholder="Your name"
              className={editing ? inputEditableClasses : inputReadonlyClasses}
            />
          </Field>

          {/* Email — always read-only */}
          <Field icon={Mail} label="Email Address">
            <div className="relative">
              <input
                value={user.email}
                disabled
                readOnly
                className={`${inputReadonlyClasses} pr-9`}
              />
              <span title="Email cannot be changed" className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] text-slate-600 font-semibold tracking-[0.04em]">
                LOCKED
              </span>
            </div>
          </Field>

          {/* Blood Group */}
          <Field icon={Droplets} label="Blood Group">
            {editing ? (
              <div className="relative">
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className={selectClasses(true)}
                >
                  {[
                    <option key="__bg" value="">Select blood group</option>,
                    ...BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    )),
                  ]}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▾</span>
              </div>
            ) : (
               <input
                 value={user.bloodGroup || "Not set"}
                 readOnly
                 className={inputReadonlyClasses}
               />
             )}
          </Field>

          {/* Role — display only */}
          <Field icon={ShieldCheck} label="Role">
            <input
              value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
              disabled
              readOnly
              className={inputReadonlyClasses}
            />
          </Field>

          {/* District */}
          <Field icon={MapPin} label="District">
            {editing ? (
              <div className="relative">
                <select
                  value={district}
                  onChange={handleDistrictChange}
                  className={selectClasses(true)}
                >
                  {[
                    <option key="__district" value="">Select district</option>,
                    ...districts.map((d) => (
                      <option key={String(d.id)} value={d.name}>{d.name}</option>
                    )),
                  ]}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▾</span>
              </div>
            ) : (
               <input
                 value={user.district || "Not set"}
                 readOnly
                 className={inputReadonlyClasses}
               />
             )}
          </Field>

          {/* Upazila */}
          <Field icon={MapPinned} label="Upazila">
            {editing ? (
              <div className="relative">
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district}
                  className={selectClasses(!!district)}
                >
                  {[
                    <option key="__upazila" value="">Select upazila</option>,
                    ...filteredUpazilas.map((u) => (
                      <option key={String(u.id)} value={u.name}>{u.name}</option>
                    )),
                  ]}
                </select>
                {district && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▾</span>
                )}
              </div>
            ) : (
               <input
                 value={user.upazila || "Not set"}
                 readOnly
                 className={inputReadonlyClasses}
               />
             )}
          </Field>

        </div>
      </div>
    </div>
  );
}