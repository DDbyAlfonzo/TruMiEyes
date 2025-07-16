// pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome to TruMiEyes</h1>
      <p>Choose an action below:</p>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <Link href="/login">🔐 Login</Link>
        </li>
        <li>
          <Link href="/upload">📤 Upload Files</Link>
        </li>
      </ul>
    </main>
  );
}
