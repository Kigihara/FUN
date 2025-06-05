import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './ServiceList.css';

// Иконка часов (outline)
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="details-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

// Компонент для анимированного текста загрузки
const AnimatedLoadingText = ({ text }) => {
  return (
    <div className="animated-loading-text">
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="animated-loading-char"
          style={{ animationDelay: `${index * 0.07}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      setError(null);
      // Раскомментируй для теста прелоадера, если нужно:
      // await new Promise(resolve => setTimeout(resolve, 1500)); 
      try {
        const { data, error: fetchError } = await supabase // Переименовал error чтобы не конфликтовать с useState
          .from('services')
          .select('id, name, description, price, duration_minutes, image_url')
          .order('price', { ascending: true });

        if (fetchError) {
          console.error('Ошибка при загрузке услуг:', fetchError);
          setError(fetchError.message);
        } else {
          setServices(data);
        }
      } catch (err) {
        console.error('Неожиданная ошибка:', err);
        setError('Произошла непредвиденная ошибка при загрузке услуг.');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <AnimatedLoadingText text="Загрузка услуг..." />
      </div>
    );
  }

  if (error) {
    return <p className="error-message">Ошибка загрузки услуг: {error}</p>;
  }

  if (services.length === 0) {
    return <p className="info-message">Пока нет доступных услуг.</p>;
  }

  return (
    <section id="services" className="service-list-section">
      <h2 className="section-title">Наши Услуги</h2>
      <div className="service-list-grid">
        {services.map((service, index) => (
          <div key={service.id} className="service-card" style={{ animationDelay: `${index * 0.1}s` }}>
            {service.image_url && (
              <div className="service-card-image-wrapper">
                <img src={service.image_url} alt={service.name} className="service-card-image" />
              </div>
            )}
            <div className="service-card-content">
              <h3 className="service-card-title">{service.name}</h3>
              <p className="service-card-description">{service.description || 'Описание отсутствует'}</p>
              
              <div className="service-card-meta">
                <div className="service-detail-item price-item">
                  <span className="price-value">{service.price}</span>
                  <span className="price-currency"> ₽</span>
                </div>
                <div className="service-detail-item duration-item">
                  <ClockIcon />
                  <span>{service.duration_minutes} мин.</span>
                </div>
              </div>

              <button 
                className="service-card-button-cta" 
                onClick={(e) => { e.preventDefault(); alert('Переход к форме записи (в разработке)'); }}
              >
                Записаться
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ServiceList;