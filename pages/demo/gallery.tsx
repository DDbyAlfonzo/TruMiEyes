import ClientGalleryPage from "../projects/[id]";
import { installDemoMocks } from "../../lib/demoMock";
import type { LabelColor } from "../../lib/labels";
import type { Slot } from "../../lib/booklets";

installDemoMocks();

const shots = ["hero", "perfume", "choker", "lace", "ring", "lips", "neck", "bottle", "nails", "choker", "perfume", "lace", "ring"];
const photos = shots.map((shot, i) => ({
  id: `p${i}`,
  imageUrl: `/demo/${shot}.jpg`,
  thumbUrl: `/demo/${shot}.jpg`,
  downloadUrl: `/demo/${shot}.jpg`,
  filename: `TME_${2140 + i * 3}.jpg`,
  downloadable: true,
  label: (i === 2 ? "GREEN" : i === 5 ? "AMBER" : null) as LabelColor | null,
  comments:
    i === 4
      ? [{ id: "c1", message: "Could we soften the background a little on this one?", createdAt: "2026-11-10T09:00:00.000Z" }]
      : [],
}));

const page = (n: number, slots: Slot[]) => ({ sketchUrl: `/demo/sketch-${n}.jpg`, slots });
const P1 = page(1, [{ x: 0.083, y: 0.067, w: 0.839, h: 0.55 }, { x: 0.083, y: 0.667, w: 0.389, h: 0.267 }, { x: 0.528, y: 0.663, w: 0.389, h: 0.275 }]);
const P2 = page(2, [{ x: 0.083, y: 0.083, w: 0.833, h: 0.833 }]);
const P3 = page(3, [{ x: 0.083, y: 0.063, w: 0.394, h: 0.413 }, { x: 0.522, y: 0.067, w: 0.4, h: 0.413 }, { x: 0.083, y: 0.521, w: 0.394, h: 0.417 }, { x: 0.522, y: 0.525, w: 0.394, h: 0.413 }]);
const P4 = page(4, [{ x: 0.083, y: 0.104, w: 0.833, h: 0.392 }, { x: 0.206, y: 0.567, w: 0.589, h: 0.333 }]);

export const DEMO_BOOKLETS = [
  { id: "l1", name: "Classic album", description: "21×28 cm", previewImageUrl: "/demo/sketch-1.jpg", capacity: 10, orientation: "PORTRAIT" as const, pages: [P1, P2, P3, P4] },
  { id: "l2", name: "Mini square", description: "20×20 cm", previewImageUrl: "/demo/sketch-3.jpg", capacity: 7, orientation: "SQUARE" as const, pages: [P3, P1] },
  { id: "l3", name: "Keepsake", description: "Single-photo pages", previewImageUrl: "/demo/sketch-2.jpg", capacity: 4, orientation: "PORTRAIT" as const, pages: [P2, P2, P2, P2] },
];

/** DEMO ONLY — the client gallery with sample photos (no database). */
export default function DemoGallery() {
  return (
    <ClientGalleryPage
      project={{
        id: "demo",
        title: "Thandi & Sipho",
        description: null,
        status: "SHARED",
        requestMessage: null,
        createdAt: "2026-11-01T09:00:00.000Z",
        shareUrl: "https://app.trumieyes.co.za/g/demo123456",
      }}
      coverUrl="/demo/hero.jpg"
      layouts={DEMO_BOOKLETS}
      photos={photos}
      favouriteIds={["p0", "p1", "p3", "p6"]}
      selection={null}
    />
  );
}
