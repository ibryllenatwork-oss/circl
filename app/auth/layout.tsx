import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* soft brand glow */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-orange/15 blur-3xl" />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-card">
            <Image src="/brand/circl-mark.png" alt="circl." width={52} height={52} priority />
          </span>
          <p className="text-sm font-medium text-muted-foreground">circl. admin</p>
        </div>
        {children}
        <p className="text-center text-xs text-muted-foreground">Access is by invitation only.</p>
      </div>
    </div>
  );
}
