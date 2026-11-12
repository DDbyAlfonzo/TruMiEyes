export type LabelColor = "GREEN" | "AMBER" | "BLUE";

export const LABELS: { color: LabelColor; name: string; swatch: string; shortcut: string }[] = [
  { color: "GREEN", name: "Must print", swatch: "#2F8F5B", shortcut: "1" },
  { color: "AMBER", name: "Retouch", swatch: "#C9821F", shortcut: "2" },
  { color: "BLUE", name: "Black & white", swatch: "#2F6FD0", shortcut: "3" },
];

export const labelByColor = Object.fromEntries(LABELS.map((label) => [label.color, label])) as Record<
  LabelColor,
  (typeof LABELS)[number]
>;
