import {
  container,
  logo,
  formContainer,
  formTitle,
  input,
  primaryButton,
} from '../styles/sharedStyles';

export default function LoginPage() {
  return (
    <main style={container}>
      <img src="/TruMiEyelogo.png" alt="TruMiEyes Logo" style={logo} />
      <h2 style={formTitle}>Login</h2>

      <form style={formContainer}>
        <input type="email" placeholder="Email" style={input} />
        <input type="password" placeholder="Password" style={input} />
        <button type="submit" style={primaryButton}>
          Login
        </button>
      </form>
    </main>
  );
}
