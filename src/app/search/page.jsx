"use client";

import { useState, useEffect, useMemo } from "react";
import { Droplets, MapPin, Search, User, Phone, Mail, Filter, AlertCircle } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL      = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_URL       = process.env.NEXT_PUBLIC_API_URL;
const BLOOD_GROUPS  = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_COLORS = {
  "A+":  "#f87171", "A-":  "#fca5a5",
  "B+":  "#fb923c", "B-":  "#fdba74",
  "AB+": "#c084fc", "AB-": "#d8b4fe",
  "O+":  "#f472b6", "O-":  "#f9a8d4",
};

// ── Shared Select Classes ─────────────────────────────────────────────────────

const selectClasses = `w-full px-4 py-3 rounded-xl border border-slate-400/20 bg-slate-900/70 text-slate-200 text-sm outline-none cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_14px_center] pr-10 transition-all focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]`;

// ── Donor Card ────────────────────────────────────────────────────────────────

function DonorCard({ donor }) {
  const bloodColor = BLOOD_COLORS[donor.bloodGroup] ?? "#f87171";
  const initials   = donor.name
    ? donor.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const hue = donor.name
    ? donor.name.charCodeAt(0) * 13 + (donor.name.charCodeAt(1) ?? 0) * 7
    : 200;

  return (
    <div 
      className="relative flex flex-col gap-4 p-[24px_22px] rounded-[18px] bg-slate-900/75 border border-slate-400/10 backdrop-blur-md overflow-hidden transition-all duration-200 hover:-translate-y-[3px] animate-[fadeUp_0.3s_ease_both]"
      style={{
        "--hover-border": `${bloodColor}55`,
        "--hover-shadow": `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${bloodColor}22`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = e.currentTarget.style.getPropertyValue('--hover-border');
        e.currentTarget.style.boxShadow   = e.currentTarget.style.getPropertyValue('--hover-shadow');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      {/* Decorative blood-type glow */}
      <div className="absolute -top-[30px] -right-[30px] w-[90px] h-[90px] rounded-full blur-[20px] pointer-events-none" 
           style={{ background: `${bloodColor}12` }} />

      {/* Header: avatar + blood badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {donor.image ? (
            <img src={donor.image} alt={donor.name} 
                 className="w-12 h-12 rounded-full object-cover shrink-0"
                 style={{ border: `2px solid ${bloodColor}55` }} />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-[0.9rem] shrink-0"
                 style={{ background: `hsl(${hue % 360}, 55%, 35%)`, border: `2px solid ${bloodColor}55` }}>
              {initials}
            </div>
          )}
          <div>
            <p className="m-0 font-bold text-slate-100 text-[0.97rem]">
              {donor.name ?? "Anonymous"}
            </p>
            <p className="m-0 mt-0.5 text-slate-500 text-xs">
              Donor
            </p>
          </div>
        </div>

        {/* Blood badge */}
        <span className="px-[13px] py-[5px] rounded-[10px] font-black text-base tracking-[0.04em]"
              style={{ background: `${bloodColor}18`, color: bloodColor, border: `1.5px solid ${bloodColor}55` }}>
          {donor.bloodGroup ?? "—"}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-[7px] text-slate-400 text-[0.84rem] bg-white/5 rounded-[10px] py-2 px-3 border border-slate-400/10">
        <MapPin size={13} className="text-slate-500 shrink-0" />
        <span>
          {[donor.upazila, donor.district].filter(Boolean).join(", ") || "Location not set"}
        </span>
      </div>

      {/* Contact info */}
      {donor.email && (
        <div className="flex items-center gap-[7px] text-slate-500 text-[0.8rem]">
          <Mail size={12} className="text-slate-600" />
          <span className="break-all">{donor.email}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [districts,  setDistricts]  = useState([]);
  const [upazilas,   setUpazilas]   = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [district,   setDistrict]   = useState("");
  const [upazila,    setUpazila]    = useState("");
  const [results,    setResults]    = useState(null); // null = not searched yet
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // Load districts + upazilas on mount
  useEffect(() => {
    setGeoLoading(true);
    Promise.all([
      fetch(`${API_URL}/data/districts.json`).then((r) => r.json()),
      fetch(`${API_URL}/data/upazilas.json`).then((r) => r.json()),
    ])
      .then(([dRaw, uRaw]) => {
        const dArr = Array.isArray(dRaw) ? dRaw.find((x) => x.data)?.data ?? [] : [];
        const uArr = Array.isArray(uRaw) ? uRaw.find((x) => x.data)?.data ?? [] : [];
        const sorted = [...dArr].sort((a, b) => a.name.localeCompare(b.name));
        setDistricts(sorted);
        setUpazilas(uArr);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setGeoLoading(false));
  }, []);

  // Filter upazilas by selected district id
  const selectedDistrict = districts.find((d) => d.name === district);
  const filteredUpazilas = useMemo(() => {
    if (!selectedDistrict) return [];
    return upazilas
      .filter((u) => u.district_id === selectedDistrict.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedDistrict, upazilas]);

  // Reset upazila when district changes
  const handleDistrictChange = (val) => {
    setDistrict(val);
    setUpazila("");
  };

  // Search using MongoDB query via dedicated endpoint
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (bloodGroup) params.set("bloodGroup", bloodGroup);
      if (district)   params.set("district",   district);
      if (upazila)    params.set("upazila",     upazila);

      const baseUrl = BASE_URL || "http://localhost:5000";
      const url = `${baseUrl}/users/search?${params.toString()}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const donors = await res.json();
      setResults(Array.isArray(donors) ? donors : []);
    } catch (err) {
      console.error("Search fetch error:", err);
      setError(`Error: ${err.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#060d1a_0%,#0a1628_45%,#060d1a_100%)] text-slate-100 font-sans pb-[60px]">
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        select option { background:#111827; color:#e2e8f0; }
      `}</style>

      {/* ── Hero header ── */}
      <div className="bg-[linear-gradient(180deg,rgba(239,68,68,0.08)_0%,transparent_100%)] border-b border-red-500/10 pt-14 px-6 pb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[18px] bg-[linear-gradient(135deg,rgba(239,68,68,0.25),rgba(220,38,38,0.12))] border border-red-500/30 mb-5 animate-[fadeUp_0.5s_ease_both]">
          <Droplets size={30} className="text-red-400" />
        </div>
        <h1 className="m-0 mb-2.5 font-extrabold tracking-tight text-[clamp(1.8rem,4vw,2.8rem)] bg-[linear-gradient(135deg,#f1f5f9_30%,#f87171)] bg-clip-text text-transparent animate-[fadeUp_0.5s_0.1s_ease_both]">
          Find Blood Donors
        </h1>
        <p className="m-0 mx-auto max-w-[500px] text-slate-500 text-base leading-relaxed animate-[fadeUp_0.5s_0.2s_ease_both]">
          Search for verified blood donors near you. Filter by blood group, district, and upazila.
        </p>
      </div>

      {/* ── Search form ── */}
      <div className="max-w-[1060px] mx-auto px-5">
        <div className="-mt-7 bg-[#0a1228]/90 border border-slate-400/10 rounded-[22px] py-8 px-7 backdrop-blur-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] animate-[fadeUp_0.5s_0.25s_ease_both]">
          <div className="flex items-center gap-2 mb-5">
            <Filter size={15} className="text-red-500" />
            <span className="font-bold text-[0.9rem] text-slate-200 tracking-[0.04em]">
              SEARCH FILTERS
            </span>
          </div>

          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-5">

              {/* Blood Group */}
              <div>
                <label className="block text-[0.75rem] font-semibold text-slate-500 tracking-[0.06em] mb-2 uppercase">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Any Blood Group</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-[0.75rem] font-semibold text-slate-500 tracking-[0.06em] mb-2 uppercase">
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={geoLoading}
                  className={`${selectClasses} ${geoLoading ? 'opacity-60' : 'opacity-100'}`}
                >
                  <option value="">{geoLoading ? "Loading…" : "Any District"}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Upazila */}
              <div>
                <label className="block text-[0.75rem] font-semibold text-slate-500 tracking-[0.06em] mb-2 uppercase">
                  Upazila
                </label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district || filteredUpazilas.length === 0}
                  className={`${selectClasses} ${(!district || filteredUpazilas.length === 0) ? 'opacity-50' : 'opacity-100'}`}
                >
                  <option value="">{!district ? "Select district first" : "Any Upazila"}</option>
                  {filteredUpazilas.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3.5 rounded-[13px] border-none text-white font-bold text-[0.97rem] flex items-center justify-center gap-2 tracking-[0.02em] transition-all duration-200 ${
                loading
                  ? "bg-red-500/40 cursor-not-allowed shadow-none"
                  : "bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_100%)] cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:opacity-90"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-[17px] h-[17px] rounded-full border-[2.5px] border-white/30 border-t-white animate-[spin_0.7s_linear_infinite]" />
                  Searching…
                </>
              ) : (
                <>
                  <Search size={17} />
                  Search Donors
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Results section ── */}
        {results === null && !loading && (
          <div className="mt-14 flex flex-col items-center gap-3.5 text-slate-700 text-center animate-[fadeUp_0.4s_0.35s_ease_both]">
            <div className="w-20 h-20 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-1">
              <Droplets size={34} className="text-red-500/30" />
            </div>
            <p className="m-0 text-[1.05rem] font-semibold text-slate-600">
              Ready to find donors
            </p>
            <p className="m-0 text-[0.85rem] text-slate-700 max-w-[340px]">
              Use the filters above and click <strong className="text-red-400">Search Donors</strong> to find matching blood donors in your area.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-7 flex items-center gap-2.5 py-3.5 px-[18px] rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[0.88rem]">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {results !== null && !loading && (
          <div className="mt-9">
            {/* Result count */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-red-500" />
                <span className="font-bold text-slate-200 text-[0.95rem]">
                  {results.length} donor{results.length !== 1 ? "s" : ""} found
                </span>
              </div>
              {(bloodGroup || district || upazila) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {bloodGroup && (
                    <span className="rounded-lg py-[3px] px-2.5 text-[0.75rem] font-bold"
                          style={{ background: `${BLOOD_COLORS[bloodGroup] ?? "#f87171"}18`, color: BLOOD_COLORS[bloodGroup] ?? "#f87171", border: `1px solid ${BLOOD_COLORS[bloodGroup] ?? "#f87171"}44` }}>
                      {bloodGroup}
                    </span>
                  )}
                  {district && (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-lg py-[3px] px-2.5 text-[0.75rem] font-semibold">
                      {district}
                    </span>
                  )}
                  {upazila && (
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg py-[3px] px-2.5 text-[0.75rem] font-semibold">
                      {upazila}
                    </span>
                  )}
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-3.5 py-15 px-6 text-center bg-slate-900/50 border border-slate-400/10 rounded-[18px]">
                <div className="w-16 h-16 rounded-full bg-red-500/5 border border-red-500/15 flex items-center justify-center">
                  <User size={26} className="text-red-500/35" />
                </div>
                <p className="m-0 font-bold text-slate-600 text-base">
                  No donors found
                </p>
                <p className="m-0 text-slate-700 text-[0.85rem] max-w-[340px]">
                  No matching donors for your criteria. Try broadening your search — remove the upazila filter or try a different district.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[18px]">
                {results.map((donor, i) => (
                  <div key={donor._id?.$oid ?? donor._id ?? i} style={{ animationDelay: `${i * 0.04}s` }}>
                    <DonorCard donor={donor} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
