import {
    container,
    logo,
    formContainer,
    formTitle,
    input,
    secondaryButton,
  } from '../styles/sharedStyles';
  
  export default function UploadPage() {
    return (
      <main style={container}>
        <img src="/TruMiEyelogo.png" alt="TruMiEyes Logo" style={logo} />
        <h2 style={formTitle}>Upload Files</h2>
  
        <form style={formContainer}>
          <input type="file" accept="image/*,.pdf,video/*" style={input} />
          <button type="submit" style={secondaryButton}>
            Upload
          </button>
        </form>
      </main>
    );
  }
  