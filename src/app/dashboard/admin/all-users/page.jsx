import { UserTable } from "@/components/dashboard/Admin/UserTable";

const page = () => {
    return (
        <>
        <p className="text-2xl font-bold">All Users</p>
        <UserTable />
        </>
    );
};

export default page;