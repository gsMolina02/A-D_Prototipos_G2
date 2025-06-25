import React from 'react';  // Asegúrate de que React esté importado
import ReactDOM from 'react-dom/client';  // Importa ReactDOM desde 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

// Cambia de ReactDOM.render a ReactDOM.createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <App />
  </Router>
);
