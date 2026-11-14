import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="w-full">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
