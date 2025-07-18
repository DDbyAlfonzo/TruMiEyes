import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

export default function SharedFilePage() {
  const router = useRouter();
  const { shareId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedFile = async () => {
      setLoading(true);
      const q = query(collection(db, 'uploads'), where('shareId', '==', shareId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        setFile(docData);
      }
      setLoading(false);
    };

    fetchSharedFile();
  }, [shareId]);

  if (loading) {
    return (
      <div className="overlay">
        <div className="container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="overlay">
        <div className="container">
          <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
          <h2>Oops, File Not Found</h2>
          <p>The shared file link is invalid or the file has been removed.</p>
          <Link href="/">
            <button className="back-button" style={{ marginTop: '1rem' }}>
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="container">
        <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
        <h2>Shared File</h2>
        <p>{file.name}</p>

        <div style={{ marginTop: '1rem' }}>
          {file.fileType === 'image' && (
            <img src={file.url} alt={file.name} style={{ maxWidth: '100%', borderRadius: '12px' }} />
          )}
          {file.fileType === 'video' && (
            <video controls src={file.url} style={{ width: '100%', borderRadius: '12px' }} />
          )}
          {file.fileType === 'pdf' && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-button"
              style={{ display: 'inline-block', marginTop: '1rem' }}
            >
              View PDF
            </a>
          )}
        </div>

        <p style={{ marginTop: '1rem' }}>
          Direct link: <a href={file.url} target="_blank" rel="noopener noreferrer">{file.url}</a>
        </p>

        <Link href="/">
          <button className="back-button" style={{ marginTop: '2rem' }}>
            ← Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
