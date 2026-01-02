
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Erro Fatal: Elemento #root não encontrado no DOM.");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Erro ao renderizar App:", err);
  }
};

// Garante que o script rode após o carregamento do DOM se não estiver em modo defer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
