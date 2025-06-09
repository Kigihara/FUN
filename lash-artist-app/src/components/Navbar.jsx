// src/components/Navbar.jsx
import React, { useState } from 'react';
import './Navbar.css';

// Принимаем полный набор пропсов, включая новые для переключения видов
function Navbar({ session, userProfile, onShowAuthModal, onLogout, authLoading, onShowMasterPanel, onShowClientView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const scrollToSection = (event, sectionId) => {
    // Сначала переключаемся на вид клиента, если мы в панели мастера
    if (onShowClientView) {
      onShowClientView();
    }
    // Даем React время на перерисовку DOM перед прокруткой
    setTimeout(() => {
        event.preventDefault();
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }, 50); // Небольшая задержка
  };

  const handleAuthClick = (modalType) => {
    onShowAuthModal(modalType);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }

  const handleShowMasterPanel = (e) => {
    e.preventDefault();
    onShowMasterPanel();
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }

  const handleShowClientView = (e) => {
      e.preventDefault();
      onShowClientView();
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <a href="/" className="navbar-logo" onClick={handleShowClientView}>LashDream Studio</a>
        <div className={`menu-icon ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
          <div className="line1"></div><div className="line2"></div><div className="line3"></div>
        </div>
        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <a href="#services" className="nav-link" onClick={(e) => scrollToSection(e, 'services')}>Услуги</a>
          </li>
          <li className="nav-item">
            <a href="#services" className="nav-link" onClick={(e) => scrollToSection(e, 'services')}>Запись онлайн</a>
          </li>
          <li className="nav-item">
            <a href="#about-me" className="nav-link" onClick={(e) => scrollToSection(e, 'about-me')}>О мастере</a>
          </li>
          <li className="nav-item">
            <a href="#contact" className="nav-link" onClick={(e) => scrollToSection(e, 'contact')}>Контакты</a>
          </li>

          {/* <<< НОВАЯ КНОПКА ДЛЯ МАСТЕРА >>> */}
          {session && userProfile?.role === 'master' && (
             <li className="nav-item">
                <a href="#master-panel" className="nav-link" onClick={handleShowMasterPanel}>Панель мастера</a>
             </li>
          )}

          {!session ? (
            <>
              <li className="nav-item nav-item-auth">
                <button 
                    className="nav-button auth-login" 
                    onClick={() => handleAuthClick('login')} 
                    disabled={authLoading}
                >
                  {authLoading ? 'Загрузка...' : 'Вход'}
                </button>
              </li>
              <li className="nav-item nav-item-auth">
                <button 
                    className="nav-button auth-signup" 
                    onClick={() => handleAuthClick('signup')} 
                    disabled={authLoading}
                >
                  {authLoading ? 'Загрузка...' : 'Регистрация'}
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <span className="nav-link user-greeting">
                  Привет, {userProfile?.full_name || session.user.email}!
                </span>
              </li>
              <li className="nav-item nav-item-auth">
                <button 
                  className="nav-button auth-logout" 
                  onClick={onLogout}
                  disabled={authLoading}
                >
                  {authLoading ? 'Выход...' : 'Выйти'}
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;