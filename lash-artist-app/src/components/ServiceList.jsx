import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './ServiceList.css';

// Компонент для анимированного текста загрузки
const AnimatedLoadingText = ({ text }) => {
  return (
    <div className="animated-loading-text">
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="animated-loading-char"
          style={{ animationDelay: `${index * 0.07}s` }} // Задержка для каждой буквы
        >
          {char === ' ' ? '\u00A0' : char} {/* Заменяем пробел на неразрывный для корректной анимации */}
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
      // Имитация более длительной загрузки для демонстрации прелоадера (можно убрать)
       // await new Promise(resolve => setTimeout(resolve, 1500)); 
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, price, duration_minutes, image_url')
          .order('price', { ascending: true });

        if (error) {
          console.error('Ошибка при загрузке услуг:', error);
          setError(error.message);
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
      <div className="loading-container"> {/* Добавим контейнер для центрирования */}
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
    <section className="service-list-section">
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
              <div className="service-card-details">
                <span className="service-card-price">{service.price} руб.</span>
                <span className="service-card-duration">{service.duration_minutes} мин.</span>
              </div>
              <button className="service-card-button">Подробнее</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ServiceList;