import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const createUserDocIfNotExists = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        role: 'client',
        email: user.email,
        createdAt: new Date(),
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await createUserDocIfNotExists(user);

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const role = userSnap.data().role;

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/upload');
      }
    } catch (error) {
      setMessage('Login failed: ' + error.message);
    }
  };

  return (
    <div className="overlay">
      <div className="container-wrapper">
        <div className="container">
          <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="submit">Login</button>
          </form>

          {message && <p style={{ marginTop: '1rem', color: 'white' }}>{message}</p>}

          <hr />
          <p style={{ color: 'white', marginTop: '1rem' }}>
            Demo credentials:
            <br />
            Admin: admin@example.com / password
            <br />
            Client: client@example.com / password
          </p>

          <Link href="/">
            <button className="back-button" style={{ marginTop: '1rem' }}>
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
