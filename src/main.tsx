import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { App } from './App';
import './styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz #root não foi encontrado no DOM.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
