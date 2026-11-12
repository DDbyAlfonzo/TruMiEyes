import NewBookletPage from "../../admin/layouts/new";
import { installDemoMocks } from "../../../lib/demoMock";

installDemoMocks();

/** DEMO ONLY — sketch-to-booklet builder; uploads stay on this device. */
export default function DemoBuilder() {
  return (
    <NewBookletPage
      uploadSketch={async (file) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { path: `/demo/${encodeURIComponent(file.name)}` };
      }}
      doneHref="/demo/gallery"
    />
  );
}
