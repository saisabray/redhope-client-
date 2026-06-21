"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  Avatar,
  Skeleton,
  useOverlayState,
} from "@heroui/react";
import { AreaChart, User, Bell, Menu, ChevronRight, LogOut, LayoutDashboard } from "lucide-react";
import { TbAsset } from "react-icons/tb";
import { MdOutlineBloodtype } from "react-icons/md";
import { authClient } from "@/lib/auth-client";


const dashboardItems = {
  donor: [
    { icon: LayoutDashboard,   label: "Dashboard",            link: "/dashboard" },
    { icon: User,              label: "Profile",              link: "/dashboard/profile" },
    { icon: TbAsset,           label: "My Requests",          link: "/dashboard/my-donation-requests" },
    { icon: MdOutlineBloodtype,label: "Create Request",       link: "/dashboard/create-donation-request" },
  ],
  admin: [
    { icon: LayoutDashboard,   label: "Dashboard",            link: "/dashboard" },
    { icon: User,              label: "Profile",              link: "/dashboard/profile" },
    { icon: User,              label: "All Users",            link: "/dashboard/all-users" },
    { icon: Bell,              label: "Donation Requests",    link: "/dashboard/all-blood-donation-request" },
  ],
  volunteer: [
    { icon: LayoutDashboard,   label: "Dashboard",            link: "/dashboard" },
    { icon: User,              label: "Profile",              link: "/dashboard/profile" },
    { icon: Bell,              label: "Donation Requests",    link: "/dashboard/all-blood-donation-request" },
  ],
};

const roleMeta = {
  admin:     { label: "Admin",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)" },
  donor:     { label: "Donor",     color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.25)" },
  volunteer: { label: "Volunteer", color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)" },
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:          "#0d0d0f",
  bgCard:      "rgba(255,255,255,0.04)",
  bgHover:     "rgba(255,255,255,0.06)",
  bgActive:    "rgba(239,68,68,0.12)",
  border:      "rgba(255,255,255,0.08)",
  accent:      "#ef4444",
  accentLight: "#f87171",
  text:        "#f1f5f9",
  muted:       "#64748b",
  subtle:      "#334155",
};

// ─── Nav content (shared desktop + mobile) ────────────────────────────────────

function NavContent({ pathname, navItems, meta, user, isPending, onNavigate, compact }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: compact ? "16px 20px 20px" : "28px 20px 20px" }}>

      {/* ── Logo ── */}
      <Link href="/" style={{ display: "flex", alignItems: "center", marginBottom: 28, textDecoration: "none" }}>
        <Image src="/images/logo-auth.png" alt="RedHope" width={150} height={150} priority />
      </Link>

      {/* ── User card ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 8,
        minHeight: 72,
      }}>
        {isPending ? (
          <>
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <Skeleton className="h-3 rounded-md w-28" />
              <Skeleton className="h-2.5 rounded-md w-16" />
            </div>
          </>
        ) : user ? (
          <>
            <Avatar size="md" className="shrink-0 ring-2 ring-red-500/40">
              <Avatar.Image src={user.image} alt={user.name} />
              <Avatar.Fallback style={{ background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                {user.name?.charAt(0).toUpperCase() ?? "U"}
              </Avatar.Fallback>
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </p>
              <span style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: meta.color,
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: 5,
                padding: "2px 8px",
                width: "fit-content",
              }}>
                {meta.label}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: C.border, margin: "16px 0 12px" }} />

      {/* ── Section label ── */}
      <p style={{ margin: "0 0 8px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.muted }}>
        Navigation
      </p>

      {/* ── Nav items ── */}
      <nav aria-label="Dashboard navigation">
        <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map(({ icon: Icon, label, link }) => {
            const isActive = link === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link);

            return (
              <li key={link}>
                <Link
                  href={link}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onNavigate}
                  className="sidebar-nav-link"
                  data-active={isActive ? "true" : "false"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                    color: isActive ? C.accentLight : C.muted,
                    background: isActive ? C.bgActive : "transparent",
                    borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.text; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}
                >
                  <Icon size={20} style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Footer ── */}
      <div>
        <div style={{ height: 1, background: C.border, margin: "16px 0 10px" }} />
        <button
          onClick={() => authClient.signOut()}
          aria-label="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: C.muted,
            fontSize: 13.5,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = C.accentLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const SIDEBAR_W = "300px";

export function DashBoardSidebar() {
  const pathname    = usePathname();
  const drawerState = useOverlayState();
  const { data: session, isPending } = authClient.useSession();

  const role     = session?.user?.role ?? "donor";
  const navItems = dashboardItems[role] ?? dashboardItems.donor;
  const meta     = roleMeta[role]       ?? roleMeta.donor;
  const user     = session?.user;

  const sharedProps = { pathname, navItems, meta, user, isPending };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex flex-col min-h-screen shrink-0"
        style={{ width: SIDEBAR_W, background: C.bg, borderRight: `1px solid ${C.border}` }}
        aria-label="Dashboard sidebar"
      >
        <NavContent {...sharedProps} onNavigate={undefined} />
      </aside>

      {/* ── Mobile ── */}
      <Drawer state={drawerState}>
        {/* Hamburger */}
        <button
          id="rh-hamburger"
          className="lg:hidden fixed top-4 left-4 z-50 flex items-center justify-center rounded-xl cursor-pointer"
          style={{
            width: 46,
            height: 46,
            background: C.bg,
            border: `1px solid ${C.border}`,
            color: C.text,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
          onClick={drawerState.open}
          aria-label="Open navigation"
          aria-expanded={drawerState.isOpen}
        >
          <Menu size={22} />
        </button>

        <Drawer.Backdrop isDismissable />

        <Drawer.Content placement="left" className="rh-drawer-content">
          <Drawer.Dialog
            aria-label="Dashboard navigation drawer"
            style={{ background: C.bg, height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Drawer.Body className="rh-drawer-body">
              <NavContent {...sharedProps} onNavigate={drawerState.close} compact />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer>

      {/* HeroUI portal overrides */}
      <style>{`
        .rh-drawer-content,
        .rh-drawer-content > *,
        .rh-drawer-content [role="dialog"] {
          background: ${C.bg} !important;
          border-right: 1px solid ${C.border} !important;
        }
        .rh-drawer-content {
          width: ${SIDEBAR_W} !important;
          max-width: 90vw !important;
        }
        .rh-drawer-body {
          padding: 0 !important;
          height: 100%;
          background: ${C.bg};
        }
      `}</style>
    </>
  );
}
