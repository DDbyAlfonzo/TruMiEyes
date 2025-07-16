// styles/sharedStyles.js

export const container = {
    padding: '2rem',
    fontFamily: 'Inter, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  };
  
  export const logo = {
    width: '150px',
    marginBottom: '1.5rem',
  };
  
  export const heading = {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  };
  
  export const paragraph = {
    fontSize: '1.2rem',
    marginBottom: '2rem',
  };
  
  export const button = {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    color: 'white',
    borderRadius: '6px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'background-color 0.3s',
    cursor: 'pointer',
  };
  
  export const primaryButton = {
    ...button,
    backgroundColor: '#3b82f6',
    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
  };
  
  export const secondaryButton = {
    ...button,
    backgroundColor: '#10b981',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
  };
  
  export const formContainer = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '2rem',
  };
  
  export const input = {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    width: '100%',
    boxSizing: 'border-box',
  };
  
  export const formTitle = {
    fontSize: '2rem',
    marginBottom: '1rem',
  };