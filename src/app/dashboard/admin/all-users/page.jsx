import { UserTable } from "@/components/dashboard/Admin/UserTable";

const AllUsersPage = () => {
  return (
    <div className="py-8 px-6 min-h-screen bg-[linear-gradient(135deg,#0a0f1e_0%,#0d1526_50%,#0a0f1e_100%)]">
      {/* Page Header */}
      <div className="mb-7">
        <h1 className="text-[1.6rem] font-bold text-slate-100 m-0 tracking-[-0.02em]">
          User Management
        </h1>
        <p className="text-slate-500 text-[0.88rem] mt-1">
          Manage user roles and access control across the platform.
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900/70 border border-slate-400/10 rounded-[18px] p-5 backdrop-blur-md">
        <UserTable />
      </div>
    </div>
  );
};

export default AllUsersPage;
