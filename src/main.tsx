import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Math rendering (KaTeX) styles for markdown math
// Install via: npm i katex
import 'katex/dist/katex.min.css';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { ensureStableUserId } from './utils/userUtils.ts';

// Ensure a stable user id is available before the app renders
try { ensureStableUserId(); } catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>
);
