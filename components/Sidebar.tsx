import Link from "next/link";
import { FolderOpen, LayoutDashboard, Layers, UploadCloud, Users, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { BrandMark } from "./BrandMark";

type SidebarProps = {
  role: "admin" | "client";
  open?: boolean;
  onClose?: () => void;
};

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/layouts", label: "Layouts", icon: Layers },
  { href: "/admin/users", label: "Users", icon: Users },
];

const clientNav = [{ href: "/client", label: "Galleries", icon: FolderOpen }];

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const nav = role === "admin" ? adminNav : clientNav;

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-line bg-[#101010] transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <Link
            href={role === "admin" ? "/admin" : "/client"}
            aria-label="TruMiEyes home"
            className="space-y-1 outline-none focus-visible:ring-2 focus-visible:ring-champagne"
          >
            <BrandMark size="md" />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 outline-none transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-red/60"
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {role === "admin" && (
          <div className="border-t border-line p-4">
            <div className="rounded-3xl border border-line bg-black/30 p-4">
              <UploadCloud className="text-brand-red" size={20} />
              <p className="mt-3 text-sm text-zinc-300">TruMiEyes galleries stay curated, quiet, and ready for client decisions.</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
