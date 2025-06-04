// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import GlobalStyles from './styles/GlobalStyles'; // Импортируем наши глобальные стили
// Удали import './index.css' если он там был

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalStyles /> {/* Добавляем глобальные стили ПЕРЕД App */}
    <App />
  </React.StrictMode>
);