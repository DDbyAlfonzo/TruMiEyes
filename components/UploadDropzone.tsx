import { ChangeEvent, DragEvent, KeyboardEvent, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "../lib/utils";

type UploadDropzoneProps = {
  onFile: (file: File) => void;
  onReject?: (message: string) => void;
  disabled?: boolean;
  label?: string;
  progress?: number | null;
};

export function UploadDropzone({
  onFile,
  onReject,
  disabled,
  label = "Drop an image or browse",
  progress,
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const acceptFile = (file?: File | null) => {
    if (!file || disabled) return;
    if (file.type && !file.type.startsWith("image/")) {
      onReject?.("Choose an image file before uploading.");
      return;
    }
    onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <label
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled}
      onKeyDown={onKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-black/20 px-6 py-10 text-center outline-none transition hover:border-brand-red/60 focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/40",
        dragging && "border-champagne bg-champagne/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-champagne">
        <UploadCloud size={22} />
      </span>
      <span className="mt-4 text-sm font-medium text-white">{label}</span>
      <span className="mt-1 text-xs text-zinc-500">JPEG, PNG, or web image assets</span>
      {typeof progress === "number" && (
        <span className="mt-5 block w-full max-w-xs">
          <span className="mb-2 flex items-center justify-between text-xs text-zinc-400">
            <span>Uploading</span>
            <span>{progress}%</span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-brand-red transition-all"
              style={{ width: `${progress}%` }}
            />
          </span>
        </span>
      )}
      <input ref={inputRef} className="sr-only" type="file" accept="image/*" onChange={onChange} disabled={disabled} tabIndex={-1} />
    </label>
  );
}
