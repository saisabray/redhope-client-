import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DonorDashboardLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");
  if (session.user.role !== "donor") redirect(`/dashboard/${session.user.role}`);

  return children;
}
