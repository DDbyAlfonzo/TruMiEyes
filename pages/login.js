import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = e => {
    e.preventDefault();
    // Implement login logic
    console.log({ email, password });
  };

  return (
    <div className="container-wrapper">
      <div className="container">
        <img src="/trumieyeslogo.png" alt="TruMiEyes Logo" className="logo" />

        <nav style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>TruMiEyes</h1>
        </nav>

        <Link href="/">
          <button
            style={{
              marginBottom: '1.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff20',
              border: '1px solid #ffffff30',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              width: 'auto',
            }}
          >
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

      {/* SVG border overlay */}
      <svg
        className="border-svg"
        width="100%"
        height="100%"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="598"
          height="398"
          rx="16"
          ry="16"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          className="border-rect"
        />
      </svg>
    </div>
  );
}
