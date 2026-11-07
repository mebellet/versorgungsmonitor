import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/700.css';
import './styles/index.css';
import App from './App.jsx';
import { VersorgungsdatenProvider } from './state/VersorgungsdatenContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <VersorgungsdatenProvider>
        <App />
      </VersorgungsdatenProvider>
    </BrowserRouter>
  </StrictMode>,
);
