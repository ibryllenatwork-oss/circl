import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireManager } from "@/lib/auth/require-manager";

async function Welcome() {
  const me = await requireManager();
  if (!me) redirect("/auth/login");

  return <p className="text-muted-foreground">Welcome, {me.email}.</p>;
}

export default function AdminHome() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Suspense>
        <Welcome />
      </Suspense>
    </div>
  );
}
