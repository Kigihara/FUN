import React, { useState } from 'react';
import './Navbar.css';
function Navbar() {
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const toggleMobileMenu = () => {
setIsMobileMenuOpen(!isMobileMenuOpen);
};
// Функция для плавного скролла к якорю (пока для примера, якоря #services может не быть)
const scrollToSection = (event, sectionId) => {
event.preventDefault();
const section = document.getElementById(sectionId);
if (section) {
section.scrollIntoView({ behavior: 'smooth' });
}
if (isMobileMenuOpen) {
setIsMobileMenuOpen(false); // Закрыть мобильное меню после клика
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
        <a href="#services" className="nav-link" onClick={(e) => scrollToSection(e, 'services')}>
          Услуги
        </a>
      </li>
      <li className="nav-item">
        {/* Пока нет страницы записи, сделаем просто ссылку */}
        <a href="#booking" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Раздел записи в разработке!'); if(isMobileMenuOpen) setIsMobileMenuOpen(false);}}>
          Запись онлайн
        </a>
      </li>
      <li className="nav-item">
        <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Раздел "О мастере" в разработке!'); if(isMobileMenuOpen) setIsMobileMenuOpen(false);}}>
          О мастере
        </a>
      </li>
      <li className="nav-item">
        <a href="#contact" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Раздел "Контакты" в разработке!'); if(isMobileMenuOpen) setIsMobileMenuOpen(false);}}>
          Контакты
        </a>
      </li>
    </ul>
  </div>
</nav>
);
}

export default Navbar;