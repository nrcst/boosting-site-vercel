import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/dashboard";
import { adminCookieName, verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookieName)?.value;
  const authorized = await verifyAdminToken(token);

  if (!authorized) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <AdminDashboard />
      </div>
    </div>
  );
}
