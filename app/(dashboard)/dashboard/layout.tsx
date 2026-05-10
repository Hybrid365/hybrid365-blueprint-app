import Link from "next/link";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#F4D23C] hover:text-[#e6c235]"
          >
            Hybrid365
          </Link>
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Member app
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
