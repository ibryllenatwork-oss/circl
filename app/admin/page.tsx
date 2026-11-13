import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function Welcome() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <p className="text-muted-foreground">Welcome, {data.claims.email}.</p>;
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
