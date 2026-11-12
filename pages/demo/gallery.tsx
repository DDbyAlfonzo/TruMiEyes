import ClientGalleryPage from "../projects/[id]";
import { installDemoMocks } from "../../lib/demoMock";
import type { LabelColor } from "../../lib/labels";

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
      layouts={[
        { id: "l1", name: "Classic landscape", description: "30×20 cm", previewImageUrl: "/demo/ring.jpg", pageCount: 40, orientation: "LANDSCAPE" },
        { id: "l2", name: "Square", description: "25×25 cm", previewImageUrl: "/demo/perfume.jpg", pageCount: 30, orientation: "SQUARE" },
        { id: "l3", name: "Portrait", description: "21×28 cm", previewImageUrl: "/demo/lace.jpg", pageCount: 50, orientation: "PORTRAIT" },
      ]}
      photos={photos}
      favouriteIds={["p0", "p1", "p3", "p6"]}
      selection={null}
    />
  );
}
