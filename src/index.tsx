import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react';

// Load Clerk publishable key from env
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// 🔒 (Optional) Log server-side secret key for debugging on backend only (DANGER: DO NOT expose it in frontend!)
const CLERK_SECRET_KEY = process.env.REACT_APP_CLERK_SECRET_KEY;

// Check that the publishable key is defined
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please set REACT_APP_CLERK_PUBLISHABLE_KEY in your environment variables.');
}

// Optional: Warn if secret key is missing (just for dev info — not needed in frontend)
if (!CLERK_SECRET_KEY) {
  console.warn('Warning: Clerk Secret Key is not set. This is fine unless you need it in backend functions.');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();
