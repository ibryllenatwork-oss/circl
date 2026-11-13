import { Suspense } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { AdminGate } from "@/components/admin/admin-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-6">
        <Suspense>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}
