import { useState } from 'react';
import Link from 'next/link';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(false);

  const handleUpload = e => {
    e.preventDefault();
    // Upload logic here
    console.log(file, allowDownload);
  };

  return (
    <div className="overlay">
      <div className="container-wrapper">
        <div className="container">
          <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />

          <Link href="/">
            <button style={{
              marginBottom: '1.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff20',
              border: '1px solid #ffffff30',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}>
              ← Back to Home
            </button>
          </Link>

          <h2>Upload File</h2>

          <form onSubmit={handleUpload}>
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              required
            />
            <label style={{ display: 'block', marginBottom: '1rem', color: 'white' }}>
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={() => setAllowDownload(!allowDownload)}
              />
              {' '}Allow clients to download
            </label>
            <button type="submit">Upload</button>
          </form>
        </div>
      </div>
    </div>
  );
}
