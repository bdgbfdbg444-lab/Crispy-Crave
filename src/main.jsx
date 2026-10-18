import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AlertProvider } from './context/AlertContext.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { initGlobalMonitoring } from './monitoring/IncidentLogger'
import { visitorTracker } from './services/visitorTracker'

// Handle chunk update mismatch gracefully
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

// Initialize real-time visitor tracking
initGlobalMonitoring();
visitorTracker.init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AlertProvider>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </AlertProvider>
    </LanguageProvider>
  </StrictMode>,
)
