import Link from 'next/link';
import {
  container,
  logo,
  heading,
  paragraph,
  primaryButton,
  secondaryButton,
} from '../styles/sharedStyles';

export default function Home() {
  return (
    <main style={container}>
      <img src="/TruMiEyelogo.png" alt="TruMiEyes Logo" style={logo} />
      <h1 style={heading}>Welcome to TruMiEyes</h1>
      <p style={paragraph}>Choose an action below:</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/login" style={primaryButton}>🔐 Login</Link>
        <Link href="/upload" style={secondaryButton}>📤 Upload Files</Link>
      </div>
    </main>
  );
}
