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

// ── Select styles (shared) ────────────────────────────────────────────────────

const selectStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(15,23,42,0.7)",
  color: "#e2e8f0",
  fontSize: "0.9rem",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: 40,
  transition: "border-color 0.2s",
};

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
    <div style={{
      background: "rgba(15,23,42,0.75)",
      border: "1px solid rgba(148,163,184,0.1)",
      borderRadius: 18,
      padding: "24px 22px",
      backdropFilter: "blur(12px)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      animation: "fadeUp 0.3s ease both",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${bloodColor}55`;
        e.currentTarget.style.transform   = "translateY(-3px)";
        e.currentTarget.style.boxShadow   = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${bloodColor}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)";
        e.currentTarget.style.transform   = "translateY(0)";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      {/* Decorative blood-type glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 90, height: 90, borderRadius: "50%",
        background: `${bloodColor}12`,
        filter: "blur(20px)",
        pointerEvents: "none",
      }} />

      {/* Header: avatar + blood badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {donor.image ? (
            <img src={donor.image} alt={donor.name} style={{
              width: 48, height: 48, borderRadius: "50%", objectFit: "cover",
              border: `2px solid ${bloodColor}55`, flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `hsl(${hue % 360}, 55%, 35%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "0.9rem",
              border: `2px solid ${bloodColor}55`, flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#f1f5f9", fontSize: "0.97rem" }}>
              {donor.name ?? "Anonymous"}
            </p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>
              Donor
            </p>
          </div>
        </div>

        {/* Blood badge */}
        <span style={{
          background: `${bloodColor}18`,
          color: bloodColor,
          border: `1.5px solid ${bloodColor}55`,
          borderRadius: 10,
          padding: "5px 13px",
          fontWeight: 900,
          fontSize: "1rem",
          letterSpacing: "0.04em",
        }}>
          {donor.bloodGroup ?? "—"}
        </span>
      </div>

      {/* Location */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        color: "#94a3b8", fontSize: "0.84rem",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 10, padding: "8px 12px",
        border: "1px solid rgba(148,163,184,0.08)",
      }}>
        <MapPin size={13} color="#64748b" style={{ flexShrink: 0 }} />
        <span>
          {[donor.upazila, donor.district].filter(Boolean).join(", ") || "Location not set"}
        </span>
      </div>

      {/* Contact info */}
      {donor.email && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#64748b", fontSize: "0.8rem" }}>
          <Mail size={12} color="#475569" />
          <span style={{ wordBreak: "break-all" }}>{donor.email}</span>
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
        // The JSON has a wrapper object with a "data" array
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060d1a 0%, #0a1628 45%, #060d1a 100%)",
      color: "#f1f5f9",
      fontFamily: "'Inter','Outfit',sans-serif",
      padding: "0 0 60px",
    }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        select:focus { border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
        select option { background:#111827; color:#e2e8f0; }
      `}</style>

      {/* ── Hero header ── */}
      <div style={{
        background: "linear-gradient(180deg, rgba(239,68,68,0.08) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(239,68,68,0.1)",
        padding: "56px 24px 48px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.12))",
          border: "1px solid rgba(239,68,68,0.3)",
          marginBottom: 20,
          animation: "fadeUp 0.5s ease both",
        }}>
          <Droplets size={30} color="#f87171" />
        </div>
        <h1 style={{
          margin: "0 0 10px",
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          animation: "fadeUp 0.5s 0.1s ease both",
          background: "linear-gradient(135deg, #f1f5f9 30%, #f87171)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Find Blood Donors
        </h1>
        <p style={{
          margin: 0, color: "#64748b", fontSize: "1rem", maxWidth: 500, marginInline: "auto",
          lineHeight: 1.6, animation: "fadeUp 0.5s 0.2s ease both",
        }}>
          Search for verified blood donors near you. Filter by blood group, district, and upazila.
        </p>
      </div>

      {/* ── Search form ── */}
      <div style={{ maxWidth: 1060, marginInline: "auto", padding: "0 20px" }}>
        <div style={{
          marginTop: -28,
          background: "rgba(10,18,40,0.9)",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: 22,
          padding: "32px 28px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.5s 0.25s ease both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
            <Filter size={15} color="#ef4444" />
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#e2e8f0", letterSpacing: "0.04em" }}>
              SEARCH FILTERS
            </span>
          </div>

          <form onSubmit={handleSearch}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}>

              {/* Blood Group */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Any Blood Group</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={geoLoading}
                  style={{ ...selectStyle, opacity: geoLoading ? 0.6 : 1 }}
                >
                  <option value="">{geoLoading ? "Loading…" : "Any District"}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Upazila */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>
                  Upazila
                </label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district || filteredUpazilas.length === 0}
                  style={{ ...selectStyle, opacity: (!district || filteredUpazilas.length === 0) ? 0.5 : 1 }}
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
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 13,
                border: "none",
                background: loading
                  ? "rgba(239,68,68,0.4)"
                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.97rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                transition: "opacity 0.2s, transform 0.15s",
                boxShadow: loading ? "none" : "0 4px 20px rgba(239,68,68,0.4)",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? (
                <>
                  <div style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
          <div style={{
            marginTop: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            color: "#334155",
            textAlign: "center",
            animation: "fadeUp 0.4s 0.35s ease both",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 4,
            }}>
              <Droplets size={34} color="rgba(239,68,68,0.3)" />
            </div>
            <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "#475569" }}>
              Ready to find donors
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", maxWidth: 340 }}>
              Use the filters above and click <strong style={{ color: "#f87171" }}>Search Donors</strong> to find matching blood donors in your area.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 28,
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 18px", borderRadius: 12,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: "0.88rem",
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {results !== null && !loading && (
          <div style={{ marginTop: 36 }}>
            {/* Result count */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 8, marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Droplets size={16} color="#ef4444" />
                <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>
                  {results.length} donor{results.length !== 1 ? "s" : ""} found
                </span>
              </div>
              {(bloodGroup || district || upazila) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {bloodGroup && (
                    <span style={{
                      background: `${BLOOD_COLORS[bloodGroup] ?? "#f87171"}18`,
                      color: BLOOD_COLORS[bloodGroup] ?? "#f87171",
                      border: `1px solid ${BLOOD_COLORS[bloodGroup] ?? "#f87171"}44`,
                      borderRadius: 8, padding: "3px 10px",
                      fontSize: "0.75rem", fontWeight: 700,
                    }}>{bloodGroup}</span>
                  )}
                  {district && (
                    <span style={{
                      background: "rgba(59,130,246,0.1)", color: "#60a5fa",
                      border: "1px solid rgba(59,130,246,0.25)",
                      borderRadius: 8, padding: "3px 10px",
                      fontSize: "0.75rem", fontWeight: 600,
                    }}>{district}</span>
                  )}
                  {upazila && (
                    <span style={{
                      background: "rgba(34,197,94,0.08)", color: "#4ade80",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: 8, padding: "3px 10px",
                      fontSize: "0.75rem", fontWeight: 600,
                    }}>{upazila}</span>
                  )}
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 14, padding: "60px 24px", textAlign: "center",
                background: "rgba(15,23,42,0.5)",
                border: "1px solid rgba(148,163,184,0.08)",
                borderRadius: 18,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={26} color="rgba(239,68,68,0.35)" />
                </div>
                <p style={{ margin: 0, fontWeight: 700, color: "#475569", fontSize: "1rem" }}>
                  No donors found
                </p>
                <p style={{ margin: 0, color: "#334155", fontSize: "0.85rem", maxWidth: 340 }}>
                  No matching donors for your criteria. Try broadening your search — remove the upazila filter or try a different district.
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: 18,
              }}>
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
