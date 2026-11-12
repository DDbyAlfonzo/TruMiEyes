/** Booklet (photo-book layout) helpers shared by the studio builder and the client preview. */

export type Slot = { x: number; y: number; w: number; h: number };
export type BookletPage = { id?: string; sketchUrl: string; slots: Slot[] };
export type Orientation = "PORTRAIT" | "LANDSCAPE" | "SQUARE";

export const PAGE_ASPECT: Record<Orientation, number> = {
  PORTRAIT: 3 / 4,
  LANDSCAPE: 3 / 2,
  SQUARE: 1,
};

export const MAX_PAGES = 60;
export const MAX_SLOTS_PER_PAGE = 12;
const MIN_SLOT = 0.04;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 1000) / 1000;

/** Keeps a slot inside the page and at a usable size. */
export function normalizeSlot(slot: Slot): Slot {
  const w = clamp(slot.w, MIN_SLOT, 1);
  const h = clamp(slot.h, MIN_SLOT, 1);
  return { x: round(clamp(slot.x, 0, 1 - w)), y: round(clamp(slot.y, 0, 1 - h)), w: round(w), h: round(h) };
}

/** Validates untrusted JSON (API input / stored data) into clean slots. */
export function parseSlots(input: unknown): Slot[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (item): item is Slot =>
        item !== null &&
        typeof item === "object" &&
        ["x", "y", "w", "h"].every((key) => Number.isFinite((item as Record<string, unknown>)[key])),
    )
    .slice(0, MAX_SLOTS_PER_PAGE)
    .map(normalizeSlot);
}

export const countSlots = (pages: { slots: Slot[] }[]) => pages.reduce((total, page) => total + page.slots.length, 0);

/** Photos a booklet holds: its slots when it was built from sketches, else the legacy page count. */
export const bookletCapacity = (pages: { slots: Slot[] }[], fallback: number) => (pages.length ? countSlots(pages) : fallback);

const M = 0.06; // page margin
const G = 0.03; // gutter

/** Quick starting points for a page when the sketch doesn't detect cleanly. */
export const SLOT_PRESETS: { id: string; name: string; slots: Slot[] }[] = [
  { id: "full", name: "Full bleed", slots: [{ x: 0, y: 0, w: 1, h: 1 }] },
  { id: "single", name: "Single", slots: [{ x: M, y: M, w: 1 - 2 * M, h: 1 - 2 * M }] },
  {
    id: "pair",
    name: "Side by side",
    slots: [
      { x: M, y: M, w: (1 - 2 * M - G) / 2, h: 1 - 2 * M },
      { x: M + (1 - 2 * M - G) / 2 + G, y: M, w: (1 - 2 * M - G) / 2, h: 1 - 2 * M },
    ],
  },
  {
    id: "stack",
    name: "Stacked",
    slots: [
      { x: M, y: M, w: 1 - 2 * M, h: (1 - 2 * M - G) / 2 },
      { x: M, y: M + (1 - 2 * M - G) / 2 + G, w: 1 - 2 * M, h: (1 - 2 * M - G) / 2 },
    ],
  },
  {
    id: "feature",
    name: "Feature + 2",
    slots: [
      { x: M, y: M, w: 1 - 2 * M, h: 0.55 },
      { x: M, y: M + 0.55 + G, w: (1 - 2 * M - G) / 2, h: 1 - 2 * M - 0.55 - G },
      { x: M + (1 - 2 * M - G) / 2 + G, y: M + 0.55 + G, w: (1 - 2 * M - G) / 2, h: 1 - 2 * M - 0.55 - G },
    ],
  },
  {
    id: "grid",
    name: "Grid of 4",
    slots: [0, 1].flatMap((row) =>
      [0, 1].map((col) => ({
        x: M + col * ((1 - 2 * M - G) / 2 + G),
        y: M + row * ((1 - 2 * M - G) / 2 + G),
        w: (1 - 2 * M - G) / 2,
        h: (1 - 2 * M - G) / 2,
      })),
    ),
  },
].map((preset) => ({ ...preset, slots: preset.slots.map(normalizeSlot) }));

/** Otsu threshold on 0–255 luminance values. */
function otsu(lum: Uint8Array) {
  const hist = new Array(256).fill(0);
  lum.forEach((value) => (hist[value] += 1));
  const total = lum.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];
  let sumB = 0;
  let weightB = 0;
  let best = 0;
  let threshold = 128;
  for (let i = 0; i < 256; i += 1) {
    weightB += hist[i];
    if (!weightB) continue;
    const weightF = total - weightB;
    if (!weightF) break;
    sumB += i * hist[i];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) ** 2;
    if (between > best) {
      best = between;
      threshold = i;
    }
  }
  return threshold;
}

/**
 * Finds hand-drawn photo boxes in a sketch: light regions fully enclosed by pen lines
 * (they don't touch the page edge) become slots. Works on RGBA pixel data, so it runs
 * in the browser on a downscaled canvas and in tests on synthetic images.
 */
export function detectSlots(rgba: Uint8ClampedArray, width: number, height: number): Slot[] {
  const size = width * height;
  const lum = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) {
    lum[i] = Math.round(0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]);
  }
  const threshold = Math.min(otsu(lum), 200);
  const ink = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) ink[i] = lum[i] <= threshold ? 1 : 0;

  // Thicken pen lines by one pixel so small gaps in hand-drawn boxes still close.
  const solid = new Uint8Array(ink);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      if (ink[i] || ink[i - 1] || ink[i + 1] || ink[i - width] || ink[i + width]) solid[i] = 1;
    }
  }

  const seen = new Uint8Array(size);
  type Region = { x0: number; y0: number; x1: number; y1: number; area: number };
  const regions: Region[] = [];
  const stack: number[] = [];

  for (let start = 0; start < size; start += 1) {
    if (solid[start] || seen[start]) continue;
    const region: Region = { x0: width, y0: height, x1: 0, y1: 0, area: 0 };
    let touchesEdge = false;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop() as number;
      const x = i % width;
      const y = (i - x) / width;
      region.area += 1;
      if (x < region.x0) region.x0 = x;
      if (x > region.x1) region.x1 = x;
      if (y < region.y0) region.y0 = y;
      if (y > region.y1) region.y1 = y;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true;
      const neighbours = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1];
      for (const n of neighbours) {
        if (n >= 0 && !solid[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    // Paper enclosed by pen lines (the outside of the page touches the edge).
    if (!touchesEdge && region.area > size * 0.003) regions.push(region);
  }

  // A region whose bounds contain another region is a drawn page frame, not a photo.
  const contains = (a: Region, b: Region) => a !== b && b.x0 >= a.x0 && b.y0 >= a.y0 && b.x1 <= a.x1 && b.y1 <= a.y1;
  const pieces = regions.filter((region) => !regions.some((other) => contains(region, other)));

  // Boxes with an "X" or other marks inside split into pieces whose bounds overlap — merge them back.
  const overlaps = (a: Region, b: Region) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const groups: Region[] = [];
  for (const piece of pieces) {
    let merged = { ...piece };
    for (let i = groups.length - 1; i >= 0; i -= 1) {
      if (overlaps(groups[i], merged)) {
        const g = groups.splice(i, 1)[0];
        merged = {
          x0: Math.min(g.x0, merged.x0),
          y0: Math.min(g.y0, merged.y0),
          x1: Math.max(g.x1, merged.x1),
          y1: Math.max(g.y1, merged.y1),
          area: g.area + merged.area,
        };
      }
    }
    groups.push(merged);
  }

  return groups
    .filter((g) => {
      const boxW = g.x1 - g.x0 + 1;
      const boxH = g.y1 - g.y0 + 1;
      // Reasonably large and box-shaped (pieces fill most of their bounds).
      return boxW * boxH > size * 0.015 && g.area / (boxW * boxH) > 0.6;
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, MAX_SLOTS_PER_PAGE)
    .map((g) => normalizeSlot({ x: (g.x0 - 1) / width, y: (g.y0 - 1) / height, w: (g.x1 - g.x0 + 3) / width, h: (g.y1 - g.y0 + 3) / height }))
    .sort((a, b) => (Math.abs(a.y - b.y) < 0.03 ? a.x - b.x : a.y - b.y));
}

/** Browser helper: loads an image file/URL, downsizes it and runs `detectSlots`. */
export async function detectSlotsFromImage(src: string, maxSide = 240): Promise<Slot[]> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const scale = maxSide / Math.max(image.naturalWidth, image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return detectSlots(context.getImageData(0, 0, width, height).data, width, height);
}
