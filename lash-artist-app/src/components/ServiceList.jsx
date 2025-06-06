import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import BookingCalendar from './BookingCalendar'; // <<< Импортируем календарь
import './ServiceList.css';
// Добавим стили для модального контейнера, можно вынести в отдельный файл, но пока тут
import './BookingModal.css'; 


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

  // Состояние для управления видимостью календаря/формы записи и выбранной услуги
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
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

  const handleBookServiceClick = (service) => {
    setSelectedServiceForBooking(service);
    setShowBookingModal(true);
    // Плавный скролл к началу модального окна или верху страницы для лучшего UX
    // Можно также заблокировать скролл основной страницы при открытом модальном окне
    const bookingSection = document.getElementById('booking-modal-section');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedServiceForBooking(null);
  };

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

  if (services.length === 0 && !showBookingModal) { // Не показываем, если открыто модальное
    return <p className="info-message">Пока нет доступных услуг.</p>;
  }

  return (
    <>
      <section id="services" className={`service-list-section ${showBookingModal ? 'hidden-when-modal-active' : ''}`}>
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
                  onClick={() => handleBookServiceClick(service)}
                >
                  Записаться
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Модальное окно/секция для бронирования */}
      {showBookingModal && selectedServiceForBooking && (
        // Обертка для секции, чтобы к ней можно было скроллить
        <div id="booking-modal-section"> 
            <div className="booking-modal-overlay" onClick={handleCloseBookingModal}></div>
            <div className="booking-modal-content">
                <button className="booking-modal-close-button" onClick={handleCloseBookingModal}>
                    ×
                </button>
                <div className="booking-modal-service-info">
                    <h3>Запись на услугу: {selectedServiceForBooking.name}</h3>
                    <p>Длительность: {selectedServiceForBooking.duration_minutes} мин. | Цена: {selectedServiceForBooking.price} ₽</p>
                </div>
                {/* Передаем ID услуги в календарь, если он понадобится для фильтрации слотов */}
                <BookingCalendar selectedService={selectedServiceForBooking} />
                {/* Здесь позже будет форма для данных клиента */}
            </div>
        </div>
      )}
    </>
  );
}

export default ServiceList;