import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceList from './components/ServiceList';
// Импортируем иконку VK
import { Icon24LogoVk } from '@vkontakte/icons'; // Для монохромной, красится через CSS
// Если нужна цветная по умолчанию: import { Icon24LogoVkColor } from '@vkontakte/icons';

import './App.css';

function App() {
  const SocialLinks = () => (
    <div className="social-links">
      {/* Instagram */}
      <a href="https://instagram.com/ВАШ_ПРОФИЛЬ" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      </a>
      {/* Telegram */}
      <a href="https://t.me/ВАШ_КАНАЛ_ИЛИ_ПРОФИЛЬ" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </a>
      {/* VK - Используем иконку из @vkontakte/icons */}
      <a href="https://vk.com/ВАША_СТРАНИЦА" target="_blank" rel="noopener noreferrer" aria-label="VK">
        <Icon24LogoVk width={27.5} height={27.5} /> {/* Задаем размеры, цвет будет из CSS */}
        {/* Если бы использовали цветную: <Icon24LogoVkColor width={24} height={24} /> */}
      </a>
    </div>
  );

  return (
    <>
      <header className="app-header">
        <Navbar />
      </header>

      <Hero />

      <main className="app-main">
        <div id="services" className="container">
          <ServiceList />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container footer-container">
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} LashDream Studio. Все права защищены.</p>
          </div>
          <SocialLinks />
          <div className="footer-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Политика конфиденциальности</a>
            <span className="footer-link-divider">|</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Условия использования</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;