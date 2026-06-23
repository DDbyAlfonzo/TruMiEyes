import { ImgHTMLAttributes, useState } from "react";
import { cn } from "../lib/utils";

type ImageWithFallbackProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export function ImageWithFallback({
  alt,
  className,
  fallbackSrc = "/bg.jpg",
  src,
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const resolvedSrc = failed || !src ? fallbackSrc : src;

  return (
    <img
      alt={alt}
      className={cn(
        "bg-black/30 transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-70",
        className,
      )}
      decoding="async"
      loading="lazy"
      src={resolvedSrc}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
}
