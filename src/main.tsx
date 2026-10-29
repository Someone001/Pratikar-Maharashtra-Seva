import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/noto-sans';
import '@fontsource-variable/noto-sans-devanagari';
import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';
import { I18nProvider } from './lib/i18n';
import { VaultProvider } from './features/vault/VaultContext';
import { App } from './app/App';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nProvider>
        <VaultProvider>
          <App />
        </VaultProvider>
      </I18nProvider>
    </React.StrictMode>,
  );
}
