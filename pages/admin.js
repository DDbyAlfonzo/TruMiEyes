import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return router.push('/login');

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const role = userDoc.data()?.role;
      if (role !== 'admin') return router.push('/upload');

      setUser(currentUser);
      fetchData();
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const usersSnap = await getDocs(collection(db, 'users'));
    const uploadsSnap = await getDocs(collection(db, 'uploads'));

    setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setUploads(uploadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
    fetchData();
  };

  const handleDeleteUser = async (userId) => {
    await deleteDoc(doc(db, 'users', userId));
    fetchData();
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return <p style={{ color: 'white', textAlign: 'center' }}>Loading admin dashboard...</p>;

  return (
    <div className="overlay">
      <div className="container-wrapper">
        <div className="container admin-container">
          <div className="top-right">
            <button onClick={handleLogout} className="back-button">Logout</button>
            <Link href="/"><button className="back-button">← Back</button></Link>
          </div>

          <h2>Admin Dashboard</h2>

          <section className="admin-section">
            <h3>Manage Users</h3>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Change Role</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="client">client</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDeleteUser(u.id)}>✖</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h3>Uploaded Files</h3>
            <div className="gallery">
              {uploads.map(file => (
                <div key={file.id} className="thumb">
                  {file.fileType === 'image' && <img src={file.url} alt={file.name} />}
                  {file.fileType === 'video' && <video src={file.url} controls />}
                  {file.fileType === 'pdf' && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.name}
                    </a>
                  )}
                  <p>{file.name}</p>
                  <span className="meta">By: {file.ownerId}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .admin-container h2 {
          color: white;
          margin-bottom: 1rem;
        }

        .admin-section {
          margin-top: 2rem;
        }

        .admin-table table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .admin-table th,
        .admin-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-table th {
          font-weight: 600;
        }

        select {
          padding: 0.4rem;
          border-radius: 4px;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: #f05454;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 1rem;
          text-align: center;
          color: white;
        }

        .thumb img,
        .thumb video {
          max-width: 100%;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .thumb .meta {
          font-size: 0.8rem;
          color: #ccc;
        }

        h3 {
          color: #f05454;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
