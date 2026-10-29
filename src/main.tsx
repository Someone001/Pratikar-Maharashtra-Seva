import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/noto-sans';
import '@fontsource-variable/noto-sans-devanagari';
import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Pratikar | प्रतिकार</h1>
        <p className="mt-2 text-muted-foreground">Privacy-first 24-hour NCII Takedown Companion</p>
      </div>
    </React.StrictMode>,
  );
}
