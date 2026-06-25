import { ReactNode } from "react";

type TopbarProps = {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  menuButton?: ReactNode;
};

export function Topbar({ title, eyebrow, actions, menuButton }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/88 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-3 px-5 md:gap-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {menuButton}
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] uppercase tracking-[0.25em] text-champagne">{eyebrow}</p>}
            {title && <h1 className="truncate font-serif text-2xl font-light tracking-wide text-white md:text-3xl">{title}</h1>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 py-2">{actions}</div>
      </div>
    </header>
  );
}
