import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    // TODO: Implement upload logic with Firebase or other service
    alert(`Uploading: ${file.name}`);
  };

  return (
    <>
      <main className="container">
        <h1>Upload Files to TruMiEyes</h1>

        <form onSubmit={handleUpload} className="form">
          <label htmlFor="fileUpload">Choose a file</label>
          <input
            id="fileUpload"
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={handleFileChange}
            required
          />
          {file && <p className="filename">Selected: {file.name}</p>}

          <button type="submit" className="btn btn-green">
            Upload
          </button>
        </form>
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
          max-width: 400px;
          margin: 0 auto;
          text-align: center;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
          letter-spacing: -0.02em;
        }

        .form {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        label {
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 1rem;
          color: #374151;
          align-self: flex-start;
        }

        input[type='file'] {
          width: 100%;
          padding: 0.5rem;
          border-radius: 6px;
          border: 1.5px solid #d1d5db;
          font-size: 1rem;
          cursor: pointer;
          transition: border-color 0.3s;
        }

        input[type='file']:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
        }

        .filename {
          margin: 1rem 0;
          font-weight: 600;
          color: #4b5563;
        }

        .btn {
          margin-top: 1.5rem;
          padding: 1rem 2rem;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 8px;
          background-color: #10b981;
          color: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .btn:hover {
          background-color: #059669;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .container {
            padding: 1.5rem;
            max-width: 100%;
          }

          h1 {
            font-size: 2rem;
          }

          input[type='file'] {
            font-size: 0.95rem;
          }

          .btn {
            font-size: 1rem;
            padding: 0.85rem;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
