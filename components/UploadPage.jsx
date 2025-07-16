'use client';
import { useState, useEffect } from 'react';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { useSession, signIn, signOut } from 'next-auth/react';

import FileCard from '@/components/FileCard';
import { storage, db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export default function UploadPage() {
  const { data: session, status } = useSession();

  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [downloadable, setDownloadable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Simple admin check by email, adjust as needed
  const isAdmin = session?.user?.email === 'ddbyalfonzo@gmail.com';

  // Fetch files from Firestore
  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const filesData = querySnapshot.docs.map((doc) => doc.data());
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFiles();
    }
  }, [status]);

  // Upload file handler
  const handleUpload = async () => {
    if (!file) return;

    const id = uuidv4();
    const storageReference = storageRef(storage, `uploads/${id}-${file.name}`);

    setUploading(true);

    try {
      await uploadBytes(storageReference, file);
      const url = await getDownloadURL(storageReference);

      await setDoc(doc(db, 'files', id), {
        id,
        name: file.name,
        url,
        type: file.type,
        downloadable,
        createdAt: new Date(),
      });

      alert('Upload successful!');
      setFile(null);
      setDownloadable(true);
      fetchFiles(); // Refresh list after upload
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed, check console.');
    } finally {
      setUploading(false);
    }
  };

  // Remove deleted file from UI list
  const handleDelete = (deletedId) => {
    setFiles((prev) => prev.filter((f) => f.id !== deletedId));
  };

  if (status === 'loading') {
    return <p className="p-4">Loading session...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to access this page</h1>
        <button
          onClick={() => signIn()}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">File Upload & Management</h1>
        <div>
          <span className="mr-4">Hello, {session.user.email}</span>
          <button
            onClick={() => signOut()}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Upload Form */}
      <section className="mb-10 border rounded p-6 shadow bg-white dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4">Upload New File</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4"
        />

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="downloadable"
            checked={downloadable}
            onChange={() => setDownloadable(!downloadable)}
            className="mr-2"
          />
          <label htmlFor="downloadable" className="select-none">
            Allow Download
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-indigo-600 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </section>

      {/* File List */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>

        {loadingFiles && <p>Loading files...</p>}

        {!loadingFiles && files.length === 0 && (
          <p className="text-gray-500">No files uploaded yet.</p>
        )}

        <div>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
