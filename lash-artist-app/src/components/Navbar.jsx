// src/components/Navbar.jsx
import React, { useState } from 'react';
import './Navbar.css';

// Принимаем пропсы: session, userProfile, onShowAuthModal, onLogout, authLoading
function Navbar({ session, userProfile, onShowAuthModal, onLogout, authLoading }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const scrollToSection = (event, sectionId) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleAuthClick = (modalType) => {
    onShowAuthModal(modalType); // Эта функция вызывается из App.jsx для установки showAuthModal
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <a href="/" className="navbar-logo">LashDream Studio</a>
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

          {!session ? (
            <>
              <li className="nav-item nav-item-auth">
                <button 
                    className="nav-button auth-login" 
                    onClick={() => handleAuthClick('login')} 
                    disabled={authLoading}
                >
                  {/* 
                    Когда authLoading true, это значит, что идет процесс входа, регистрации ИЛИ выхода.
                    Если мы нажимаем "Вход", то текст должен быть "Вход..." во время загрузки.
                    Но так как authLoading общий, он будет true и при выходе.
                    Для простоты пока оставим так: если authLoading, то общий текст загрузки.
                    Или можно показывать разный текст в зависимости от того, какая модалка открыта,
                    но Navbar не знает, какая именно (login или signup) без доп. пропа.
                    Простой вариант:
                  */}
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
                  {userProfile?.role === 'master' && ' (Мастер)'}
                </span>
              </li>
              <li className="nav-item nav-item-auth">
                <button 
                  className="nav-button auth-logout" 
                  onClick={onLogout} // <<<<<<<<<<<<<< ВОТ ЗДЕСЬ ВЫЗЫВАЕТСЯ onLogout (что есть handleLogout из App.jsx)
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