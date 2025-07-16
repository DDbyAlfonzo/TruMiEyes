import Link from 'next/link';

export default function Home() {
  return (
    <>
      <main className="container">
        <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
        <h1>Welcome to TruMiEyes</h1>
        <p className="subtitle">
          Securely upload, manage, and share your photos, videos, and documents.
        </p>

        <div className="actions">
          <Link href="/login" legacyBehavior>
            <a className="btn btn-blue">🔐 Login</a>
          </Link>

          <Link href="/upload" legacyBehavior>
            <a className="btn btn-green">📤 Upload Files</a>
          </Link>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          color: #111827;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .logo {
          width: 160px;
          margin-bottom: 2rem;
          user-select: none;
        }

        h1 {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 1.25rem;
          color: #6b7280;
          margin-bottom: 3rem;
          line-height: 1.5;
        }

        .actions {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        .btn {
          flex: 1 1 140px;
          display: inline-block;
          padding: 1rem;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          user-select: none;
          text-decoration: none;
          transition: background-color 0.3s ease;
          color: white;
          cursor: pointer;
        }

        .btn-blue {
          background-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .btn-blue:hover {
          background-color: #2563eb;
        }

        .btn-green {
          background-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .btn-green:hover {
          background-color: #059669;
        }

        /* Responsive typography */
        @media (max-width: 480px) {
          h1 {
            font-size: 2.2rem;
          }

          .subtitle {
            font-size: 1rem;
            margin-bottom: 2rem;
          }

          .btn {
            flex: 1 1 100%;
            font-size: 1rem;
            padding: 0.85rem;
          }
        }
      `}</style>
    </>
  );
}
