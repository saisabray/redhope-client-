import { DashBoardSidebar } from "@/components/dashboard/DashBoardSideBar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#18181cff" }}>
      {/* Sidebar (hidden on mobile via its own internal logic) */}
      <DashBoardSidebar />

      {/* Page content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <main
          className="flex-1 overflow-y-auto"
          /*
           * Mobile  : pt-20 (80px) pushes content below the 46px fixed hamburger (top-4 = 16px + 46px = 62px)
           * Desktop : lg removes that offset, uses standard padding
           */
          style={{ flex: 1, overflowY: "auto" }}
        >
          {/* Responsive inner wrapper */}
          <div
            className="
              min-h-full
              px-4 py-5
              pt-20
              lg:pt-8 lg:px-8 lg:py-8
              xl:px-10 xl:py-10
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}