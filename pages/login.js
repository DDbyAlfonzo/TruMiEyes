import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = e => {
    e.preventDefault();
    // Implement login logic here
    console.log({ email, password });
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

          <h2>Login to TruMiEyes</h2>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}
