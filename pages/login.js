import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log({ email, password });
    // Add Firebase auth logic here
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
          <h2>Login</h2>

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
