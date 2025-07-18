import Link from 'next/link';

export default function Home() {
  return (
    <div className="overlay">
      <div className="container-wrapper">
        <div className="container">
          <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
          <nav>
            <h1>Welcome</h1>
          </nav>
          <p>Securely upload, store, and share your photos, videos, and documents.</p>

          <Link href="/login" passHref>
            <button>Login</button>
          </Link>
          <Link href="/upload" passHref>
            <button style={{ marginTop: '1rem' }}>Upload</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
