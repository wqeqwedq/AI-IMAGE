import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/admin/require-admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin",
    robots: { index: false, follow: false },
};

export default async function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    await requireAdmin();

    return (
        <div className="flex min-h-[calc(100vh-0px)] w-full">
            <AdminSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
