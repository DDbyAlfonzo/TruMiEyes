import Link from "next/link";
import { Calendar, Images } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ImageWithFallback } from "./ImageWithFallback";

type GalleryCardProps = {
  href: string;
  title: string;
  status: string;
  createdAt: string;
  photoCount: number;
  coverImageUrl?: string | null;
  clientEmail?: string;
};

export function GalleryCard({
  href,
  title,
  status,
  createdAt,
  photoCount,
  coverImageUrl,
  clientEmail,
}: GalleryCardProps) {
  return (
    <Link
      href={href}
      aria-label={`Open ${title}`}
      className="group block overflow-hidden rounded-3xl bg-surface outline-none transition focus-visible:ring-2 focus-visible:ring-brand-red"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <ImageWithFallback
          src={coverImageUrl || "/bg.jpg"}
          alt=""
          className="h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/0" />
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-champagne backdrop-blur">
          TruMiEyes
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <StatusBadge status={status} />
          <h2 className="mt-3 line-clamp-2 break-words text-2xl font-light tracking-wide text-white">
            {title}
          </h2>
          {clientEmail && <p className="mt-1 line-clamp-1 break-all text-sm text-zinc-400">{clientEmail}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between border-x border-b border-line px-4 py-4 text-sm text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <Calendar size={15} /> {new Date(createdAt).toLocaleDateString()}
        </span>
        <span className="inline-flex items-center gap-2">
          <Images size={15} /> {photoCount}
        </span>
      </div>
    </Link>
  );
}
