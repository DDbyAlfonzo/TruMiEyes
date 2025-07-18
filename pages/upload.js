import { useEffect, useState } from 'react';
import { auth, db, storage } from '../lib/firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid'; // <--- NEW

export default function Upload() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login');
      } else {
        setUser(u);
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        const userData = userSnap.data();
        setRole(userData?.role || 'client');
        fetchUploads(userData?.role || 'client', u.uid);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUploads = async (role, uid) => {
    const q =
      role === 'admin'
        ? collection(db, 'uploads')
        : query(collection(db, 'uploads'), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    setUploadedFiles(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.length) return setMessage('Select a file first.');
    setUploading(true);
    for (let file of files) {
      const fileType = file.type.includes('image')
        ? 'image'
        : file.type.includes('video')
        ? 'video'
        : 'pdf';
      const fileRef = ref(storage, `uploads/${user.uid}/${file.name}`);
      const task = uploadBytesResumable(fileRef, file);
      const shareId = uuidv4().slice(0, 8); // Short unique share ID

      await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          (snap) => {
            setProgress((snap.bytesTransferred / snap.totalBytes) * 100);
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            await addDoc(collection(db, 'uploads'), {
              name: file.name,
              url,
              ownerId: user.uid,
              fileType,
              timestamp: new Date(),
              shareId, // 🔥 Added shareId
            });
            resolve();
          }
        );
      });
    }
    setMessage('Upload successful!');
    setFiles([]);
    setUploading(false);
    fetchUploads(role, user.uid);
  };

  const handleDelete = async (file) => {
    await deleteDoc(doc(db, 'uploads', file.id));
    await deleteObject(ref(storage, `uploads/${file.ownerId}/${file.name}`));
    fetchUploads(role, user.uid);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="overlay">
      <div className="container">
        <div className="top-right">
          <button onClick={handleLogout} className="back-button">
            Logout
          </button>
          <Link href="/">
            <button className="back-button">← Back</button>
          </Link>
        </div>

        <h2>Upload Files</h2>
        {role === 'client' ? (
          <form onSubmit={handleUpload}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
            />
            <button type="submit" disabled={uploading}>
              {uploading ? `Uploading ${Math.round(progress)}%` : 'Upload'}
            </button>
          </form>
        ) : (
          <p>Admins can view all uploads below.</p>
        )}

        {message && <p style={{ color: 'white' }}>{message}</p>}

        <div className="gallery">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="thumb">
              {file.fileType === 'image' && (
                <img src={file.url} alt={file.name} />
              )}
              {file.fileType === 'video' && (
                <video src={file.url} controls width="100%" />
              )}
              {file.fileType === 'pdf' && (
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
              )}
              <p>{file.name}</p>
              <p style={{ fontSize: '0.8rem' }}>
                Share link:{' '}
                <a
                  href={`/share/${file.shareId}`}
                  target="_blank"
                  style={{ color: 'lightblue' }}
                >
                  /share/{file.shareId}
                </a>
              </p>
              {role === 'admin' && (
                <button onClick={() => handleDelete(file)}>Delete</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
