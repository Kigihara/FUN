import React, { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (event, sectionId) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false); 
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <a href="/" className="navbar-logo">
          LashDream Studio
        </a>

        <div className={`menu-icon ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </div>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <li className="nav-item">
            {/* Ссылка "Запись онлайн" теперь может вести к секции услуг или будущей общей странице записи */}
            <a href="#services" className="nav-link" onClick={(e) => scrollToSection(e, 'services')}>
              Запись онлайн
            </a>
          </li>
          <li className="nav-item">
            {/* ИЗМЕНЕНИЕ ЗДЕСЬ */}
            <a href="#booking" className="nav-link" onClick={(e) => scrollToSection(e, 'booking')}>
              Запись онлайн
            </a>
          </li>
          <li className="nav-item">
            <a href="#about-me" className="nav-link" onClick={(e) => scrollToSection(e, 'about-me')}>
              О мастере
            </a>
          </li>
          <li className="nav-item">
            <a href="#contact" className="nav-link" onClick={(e) => scrollToSection(e, 'contact')}>
              Контакты
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;