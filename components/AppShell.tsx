import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import { signOut } from "next-auth/react";
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
                <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
                  Log out
                </Button>
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
