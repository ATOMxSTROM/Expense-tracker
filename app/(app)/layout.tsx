import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/clients", label: "Clients" },
  { href: "/projects", label: "Projects" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold text-slate-900">UniqCon Tracker</span>
            <nav className="flex gap-5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-900 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-900">
            <span>
              {profile.name ?? profile.email} ({profile.role.toLowerCase()})
            </span>
            <form action={logout}>
              <button type="submit" className="text-slate-900 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
