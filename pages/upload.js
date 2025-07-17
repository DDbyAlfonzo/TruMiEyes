import { useState } from 'react';
import Link from 'next/link';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(false);

  const handleUpload = (e) => {
    e.preventDefault();
    console.log(file, allowDownload);
    // Add upload logic here
  };

  return (
    <div className="overlay">
      <div className="container-wrapper">
        <div className="container">
          <div className="top-right">
            <Link href="/">
              <button className="back-button">
                ← Back
              </button>
            </Link>
          </div>

          <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
          <h2>Upload</h2>

          <form onSubmit={handleUpload}>
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              required
            />
            <label style={{ display: 'block', marginBottom: '1rem', color: '#fff' }}>
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={() => setAllowDownload(!allowDownload)}
              />
              Allow clients to download
            </label>
            <button type="submit">Upload</button>
          </form>
        </div>
      </div>
    </div>
  );
}
