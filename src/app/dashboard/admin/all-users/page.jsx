import { UserTable } from "@/components/dashboard/Admin/UserTable";

const AllUsersPage = () => {
  return (
    <div
      style={{
        padding: "32px 24px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1526 50%, #0a0f1e 100%)",
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          User Management
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: 4 }}>
          Manage user roles and access control across the platform.
        </p>
      </div>

      {/* Table Card */}
      <div
        style={{
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(148,163,184,0.1)",
          borderRadius: 18,
          padding: "20px 20px",
          backdropFilter: "blur(12px)",
        }}
      >
        <UserTable />
      </div>
    </div>
  );
};

export default AllUsersPage;
