import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#151d35', color: '#e2e8f0', border: '1px solid #1e2d4a', borderRadius: '10px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0e1a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0a0e1a' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
