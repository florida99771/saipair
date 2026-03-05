import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import './i18n';
import App from './App';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
);
