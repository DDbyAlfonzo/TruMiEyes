import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
      <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  <h1 style={{ margin: 0 }}>TruMiEyes</h1>
</nav>
      <h2>Welcome</h2>
      <p>Securely upload, store, and share your photos, videos, and documents.</p>
      <Link href="/login"><button>Login</button></Link>
      <Link href="/upload"><button style={{ marginTop: '1rem' }}>Upload</button></Link>
    </div>
  );
}
