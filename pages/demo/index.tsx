import GalleryAccessPage from "../g/[slug]";
import { installDemoMocks } from "../../lib/demoMock";

installDemoMocks();

/** DEMO ONLY — the client's link + code screen. Try any 6-digit code (ending in 1 shows the error). */
export default function DemoAccess() {
  return (
    <GalleryAccessPage
      slug="demo123456"
      projectId="demo"
      title="Thandi & Sipho"
      photoCount={13}
      coverUrl="/demo/neck.jpg"
      redirectTo="/demo/gallery"
    />
  );
}
