import React from 'react';
import './Hero.css';

const BackgroundImageUrl = 'https://i.pinimg.com/originals/f7/da/64/f7da64c779a34a811c94617088e02579.jpg';

function Hero() {
  const scrollToServices = (event) => {
    event.preventDefault();
    const servicesSection = document.getElementById('services'); // Используем ID секции услуг
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" style={{ backgroundImage: `url(${BackgroundImageUrl})` }}>
      <div className="hero-overlay"></div>
      <div className="hero-content container">
        <h1 className="hero-headline">Взгляд, который вдохновляет.</h1>
        <p className="hero-subheadline">
          Место, где рождается магия взгляда. Профессионализм и забота в каждой детали.
        </p>
        <button className="hero-cta-button" onClick={scrollToServices}> {/* Добавляем onClick сюда */}
          Подобрать услугу
        </button>
      </div>
      {/* Раскомментировано и сделано ссылкой */}
      <a href="#services" className="scroll-down-indicator" onClick={scrollToServices} aria-label="Прокрутить вниз">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32"> {/* Увеличил размер */}
          <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path>
          </svg>
      </a>
    </section>
  );
}

export default Hero;
