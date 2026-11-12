import { ClipboardEvent, KeyboardEvent, useRef } from "react";
import { cn } from "../../lib/utils";

type CodeInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
};

/** Segmented one-time-code input: auto-advance, backspace, paste and SMS autofill. */
export function CodeInput({ length, value, onChange, onComplete, invalid, disabled }: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const setDigit = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) return;
    // Autofill/paste can deliver the whole code into one box.
    const next = (value.slice(0, index) + incoming).slice(0, length);
    const clean = commit(next);
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const cut = digits[index] ? index : Math.max(0, index - 1);
      commit(value.slice(0, cut));
      refs.current[cut]?.focus();
    } else if (event.key === "ArrowLeft") refs.current[Math.max(0, index - 1)]?.focus();
    else if (event.key === "ArrowRight") refs.current[Math.min(length - 1, index + 1)]?.focus();
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const clean = commit(event.clipboardData.getData("text"));
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  };

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          onChange={(event) => setDigit(i, event.target.value)}
          onKeyDown={(event) => onKeyDown(i, event)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "h-14 w-full rounded-xl border bg-white/10 text-center text-2xl font-light text-white outline-none backdrop-blur transition focus:border-white focus:bg-white/15 disabled:opacity-60 sm:h-16",
            invalid ? "border-[#F07A7E]" : "border-white/30",
          )}
        />
      ))}
    </div>
  );
}
