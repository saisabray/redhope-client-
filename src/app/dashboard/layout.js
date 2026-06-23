import { DashBoardSidebar } from "@/components/dashboard/DashBoardSideBar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#18181c]">
      {/* Sidebar (hidden on mobile via its own internal logic) */}
      <DashBoardSidebar />

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Responsive inner wrapper */}
          <div className="min-h-full px-4 py-5 pt-20 lg:pt-8 lg:px-8 lg:py-8 xl:px-10 xl:py-10 text-slate-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}