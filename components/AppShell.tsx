import { ReactNode, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Settings, UserCircle, Users } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  role?: "admin" | "client";
  actions?: ReactNode;
};

export function AppShell({ children, title, eyebrow, role = "client", actions }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const initials = session?.user?.name?.trim()?.[0] || session?.user?.email?.trim()?.[0] || "T";

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="flex min-h-screen">
        <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
        <div className="min-w-0 flex-1">
          <Topbar
            title={title}
            eyebrow={eyebrow}
            actions={
              <>
                {actions}
                <details className="group relative">
                  <summary className="flex h-11 cursor-pointer list-none items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 pr-4 text-sm text-zinc-200 outline-none transition hover:border-brand-red/50 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-brand-red/70 [&::-webkit-details-marker]:hidden">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-sm font-semibold uppercase text-white">
                      {initials}
                    </span>
                    <span className="hidden max-w-[150px] truncate md:block">
                      {session?.user?.name || session?.user?.email || "Profile"}
                    </span>
                  </summary>
                  <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-3xl border border-white/10 bg-[#121212]/95 p-2 shadow-2xl shadow-black/45 backdrop-blur-xl">
                    <div className="border-b border-line px-3 py-3">
                      <p className="truncate text-sm text-white">{session?.user?.name || "TruMiEyes"}</p>
                      <p className="mt-1 truncate text-xs text-muted">{session?.user?.email}</p>
                    </div>
                    <Link
                      href={role === "admin" ? "/admin/settings" : "/client"}
                      className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <UserCircle size={16} />
                      Profile
                    </Link>
                    {role === "admin" && (
                      <Link
                        href="/admin/users"
                        className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                      >
                        <Users size={16} />
                        Team
                      </Link>
                    )}
                    <Link
                      href={role === "admin" ? "/admin/settings" : "/client"}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-brand-red/15 hover:text-white"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </details>
              </>
            }
            menuButton={
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
                <Menu size={18} />
                <span className="sr-only">Open navigation</span>
              </Button>
            }
          />
          <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
