import { Aperture, ImagePlus } from "lucide-react";
import { Button } from "./ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
};

export function EmptyState({ title, description, actionLabel, onAction, href }: EmptyStateProps) {
  const action = actionLabel ? (
    href ? (
      <a className="inline-flex h-11 items-center rounded-full bg-champagne px-5 text-sm font-medium text-black" href={href}>
        {actionLabel}
      </a>
    ) : (
      <Button onClick={onAction}>{actionLabel}</Button>
    )
  ) : null;

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-brand-red/25 bg-black/30 text-brand-red brand-glow">
        {actionLabel ? <ImagePlus size={22} /> : <Aperture size={22} />}
      </div>
      <h3 className="text-xl font-light tracking-wide text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
