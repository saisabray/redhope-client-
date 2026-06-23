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
    { icon: LayoutDashboard,   label: "Overview",            link: "/dashboard/donor" },
    { icon: User,              label: "Profile",              link: "/dashboard/profile" },
    { icon: TbAsset,           label: "My Requests",          link: "/dashboard/my-donation-requests" },
    { icon: MdOutlineBloodtype,label: "Create Request",       link: "/dashboard/create-donation-request" },
  ],
  admin: [
    { icon: LayoutDashboard,   label: "Overview",             link: "/dashboard/admin" },
    { icon: User,              label: "Profile",              link: "/dashboard/profile" },
    { icon: User,              label: "All Users",            link: "/dashboard/admin/all-users" },
    { icon: Bell,              label: "Donation Requests",    link: "/dashboard/donation-request" },
  ],
  volunteer: [
    { icon: LayoutDashboard,   label: "Overview",            link: "/dashboard/volunteer" },
    { icon: User,              label: "Profile",              link: "/dashboard/profile" },
    { icon: Bell,              label: "Donation Requests",    link: "/dashboard/donation-request" },
  ],
};

const roleMeta = {
  admin:     { label: "Admin",     text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/25" },
  donor:     { label: "Donor",     text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  volunteer: { label: "Volunteer", text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/25" },
};

// ─── Nav content (shared desktop + mobile) ────────────────────────────────────

function NavContent({ pathname, navItems, meta, user, isPending, onNavigate, compact }) {
  return (
    <div className={`flex flex-col h-full ${compact ? "px-5 pt-4 pb-5" : "px-5 pt-7 pb-5"}`}>

      {/* ── Logo ── */}
      <Link href="/" className="flex items-center mb-7 no-underline">
        <Image src="/images/logo-auth.png" alt="RedHope" width={150} height={150} priority />
      </Link>

      {/* ── User card ── */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 mb-2 min-h-[72px]">
        {isPending ? (
          <>
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-3 rounded-md w-28" />
              <Skeleton className="h-2.5 rounded-md w-16" />
            </div>
          </>
        ) : user ? (
          <>
            <Avatar size="md" className="shrink-0 ring-2 ring-red-500/40">
              <Avatar.Image src={user.image} alt={user.name} />
              <Avatar.Fallback className="bg-[linear-gradient(135deg,#ef4444,#f97316)] text-white font-bold text-base">
                {user.name?.charAt(0).toUpperCase() ?? "U"}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="m-0 text-sm font-semibold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">
                {user.name}
              </p>
              <span className={`inline-block text-[10px] font-bold tracking-[0.6px] uppercase ${meta.text} ${meta.bg} border ${meta.border} rounded-[5px] px-2 py-0.5 w-fit`}>
                {meta.label}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-white/10 my-4" />

      {/* ── Section label ── */}
      <p className="m-0 mb-2 ml-1 text-[10px] font-bold tracking-[1px] uppercase text-slate-500">
        Navigation
      </p>

      {/* ── Nav items ── */}
      <nav aria-label="Dashboard navigation">
        <ul role="list" className="list-none m-0 p-0 flex flex-col gap-[3px]">
          {navItems.map(({ icon: Icon, label, link }) => {
           
            const overviewLinks = ["/dashboard/admin", "/dashboard/donor", "/dashboard/volunteer"];
            const isActive = overviewLinks.includes(link)
              ? pathname === link
              : pathname.startsWith(link);

            return (
              <li key={link}>
                <Link
                  href={link}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium no-underline transition-colors duration-150 border-l-[3px] group ${
                    isActive 
                      ? "text-red-400 bg-red-500/10 border-red-500" 
                      : "text-slate-500 bg-transparent border-transparent hover:bg-white/5 hover:text-slate-100"
                  }`}
                >
                  <Icon size={20} className="shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-60" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Footer ── */}
      <div>
        <div className="h-px bg-white/10 mt-4 mb-2.5" />
        <button
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/";
          }}
          aria-label="Sign out"
          className="flex items-center gap-2.5 w-full px-[14px] py-[10px] rounded-lg border-none bg-transparent text-slate-500 text-[13.5px] font-medium cursor-pointer transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400 group"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

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
        className="hidden lg:flex flex-col min-h-screen shrink-0 w-[300px] bg-[#0d0d0f] border-r border-white/10"
        aria-label="Dashboard sidebar"
      >
        <NavContent {...sharedProps} onNavigate={undefined} />
      </aside>

      {/* ── Mobile ── */}
      <Drawer state={drawerState}>
        {/* Hamburger */}
        <button
          id="rh-hamburger"
          className="lg:hidden fixed top-4 left-4 z-50 flex items-center justify-center rounded-xl cursor-pointer w-[46px] h-[46px] bg-[#0d0d0f] border border-white/10 text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
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
            className="bg-[#0d0d0f] h-full flex flex-col"
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
          background: #0d0d0f !important;
          border-right: 1px solid rgba(255,255,255,0.08) !important;
        }
        .rh-drawer-content {
          width: 300px !important;
          max-width: 90vw !important;
        }
        .rh-drawer-body {
          padding: 0 !important;
          height: 100%;
          background: #0d0d0f;
        }
      `}</style>
    </>
  );
}
