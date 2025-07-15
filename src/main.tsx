import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Enable future flags
const enableFutureFlags = () => {
  // @ts-ignore - This is an internal API that we're using to enable future flags
  window.__reactRouterUseFutureBehavior = true;
};

enableFutureFlags();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
