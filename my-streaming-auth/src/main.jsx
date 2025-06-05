// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import GlobalStyles from './styles/GlobalStyles';
import { BrowserRouter } from 'react-router-dom'; // <--- ИМПОРТ

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- ОБЕРТКА */}
      <GlobalStyles />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);