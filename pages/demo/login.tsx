import LoginPage from "../login";
import { installDemoMocks } from "../../lib/demoMock";

installDemoMocks();

/** DEMO ONLY — studio sign-in. Any email and password goes to the booklet builder. */
export default function DemoLogin() {
  return <LoginPage afterSignIn="/demo/booklets/new" />;
}
