// src/components/ServiceList.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import BookingCalendar from './BookingCalendar';
import './ServiceList.css';
import './BookingModal.css'; 
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="details-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

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

function ServiceList({ userProfile, session }) { 
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [finalSelectedDate, setFinalSelectedDate] = useState(null);
  const [finalSelectedTime, setFinalSelectedTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[ServiceList useEffect] Fetching services...');
    setLoading(true);
    setError(null);

    const fetchServices = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('services')
          .select('id, name, description, price, duration_minutes, image_url')
          .order('price', { ascending: true });

        if (fetchError) throw fetchError;
        
        setServices(data || []);
      } catch (err) {
        console.error('Ошибка при загрузке услуг:', err.message);
        setError('Не удалось загрузить список услуг.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []); // Пустой массив зависимостей - загружаем один раз при монтировании

  useEffect(() => {
    if (showBookingModal) {
      if (session && userProfile) {
        setClientName(userProfile.full_name || '');
        setClientPhone(userProfile.phone || '');
      } else {
        setClientName('');
        setClientPhone('');
      }
    }
  }, [showBookingModal, session, userProfile]);

  const handleBookServiceClick = (service) => {
    setSelectedServiceForBooking(service);
    setShowBookingModal(true);
    setFinalSelectedDate(null);
    setFinalSelectedTime(null);
    setIsSubmitting(false); 
  };

  const handleCloseBookingModal = () => {
    if (isSubmitting) return;
    setShowBookingModal(false);
    setSelectedServiceForBooking(null);
  };

  const handleDateTimeSelectionConfirmed = (date, time) => {
    setFinalSelectedDate(date);
    setFinalSelectedTime(time); 
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || typeof durationMinutes !== 'number') return null;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalStartMinutes = hours * 60 + minutes;
    const totalEndMinutes = totalStartMinutes + durationMinutes;
    const endHours = Math.floor(totalEndMinutes / 60);
    const endMinutes = totalEndMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  };

  const handleBookingConfirm = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
        toast.error('Пожалуйста, заполните ваше имя и телефон.');
        return;
    }
    if (!finalSelectedDate || !finalSelectedTime || !selectedServiceForBooking) {
        toast.error('Пожалуйста, выберите услугу, дату и время для записи.');
        return;
    }

    setIsSubmitting(true);

    const bookingEndTime = calculateEndTime(finalSelectedTime, selectedServiceForBooking.duration_minutes);
    if (!bookingEndTime) {
        toast.error('Не удалось рассчитать время окончания услуги.');
        setIsSubmitting(false);
        return;
    }

    const bookingData = {
      service_id: selectedServiceForBooking.id,
      user_id: session?.user?.id || null, // Более безопасное присвоение
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: session?.user?.email || null,
      booking_date: format(finalSelectedDate, 'yyyy-MM-dd'), // Используем date-fns для надежности
      booking_start_time: `${finalSelectedTime}:00`, // <<< ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ
      booking_end_time: bookingEndTime,
      duration_minutes: selectedServiceForBooking.duration_minutes,
      price: selectedServiceForBooking.price,
      status: 'pending', 
    };
    
    console.log("Отправка данных бронирования в Supabase:", bookingData);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select(); 

      if (error) {
        console.error('Ошибка при создании бронирования в Supabase:', error);
        toast.error(`Не удалось создать запись: ${error.message}`);
      } else {
        console.log('Бронирование успешно создано в Supabase:', data);
        toast.success('Ваша заявка на запись принята! Мастер свяжется с вами для подтверждения.');
        handleCloseBookingModal(); 
      }
    } catch (err) {
      console.error('Неожиданная ошибка при попытке бронирования:', err);
      toast.error('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <AnimatedLoadingText text="Загрузка услуг..." />
      </div>
    );
  }

  if (error) {
    return <p className="error-message">Ошибка: {error}</p>;
  }

  return (
    <>
      <section 
        id="services" 
        className={`service-list-section ${showBookingModal ? 'modal-open-behind' : ''}`}
        aria-hidden={showBookingModal}
      >
        <h2 className="section-title">Наши Услуги</h2>
        <div className="service-list-grid">
          {(services.length > 0) ? (
            services.map((service, index) => (
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
                    disabled={showBookingModal} 
                  >
                    Записаться
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="info-message">Услуги еще не добавлены.</p>
          )}
        </div>
      </section>

      {showBookingModal && selectedServiceForBooking && (
        <div id="booking-modal-section" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title"> 
            <div className="booking-modal-overlay" onClick={handleCloseBookingModal}></div>
            <div className="booking-modal-content">
                <button 
                    className="booking-modal-close-button" 
                    onClick={handleCloseBookingModal}
                    aria-label="Закрыть окно записи"
                    disabled={isSubmitting}
                >
                    ×
                </button>
                <div className="booking-modal-service-info">
                    <h3 id="booking-modal-title">Запись на услугу: {selectedServiceForBooking.name}</h3>
                    <p>Длительность: {selectedServiceForBooking.duration_minutes} мин. | Цена: {selectedServiceForBooking.price} ₽</p>
                </div>
                
                <BookingCalendar 
                    selectedService={selectedServiceForBooking} 
                    onDateTimeConfirm={handleDateTimeSelectionConfirmed}
                />

                <div className="booking-form-client-details">
                    <h4>Ваши контактные данные:</h4>
                    <div className="form-group">
                        <label htmlFor="clientName">Имя</label>
                        <input 
                            type="text" 
                            id="clientName" 
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Как к вам обращаться?"
                            required 
                            aria-required="true"
                            disabled={isSubmitting || (session && !!userProfile?.full_name)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="clientPhone">Телефон</label>
                        <input 
                            type="tel" 
                            id="clientPhone" 
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="+7 (___) ___-__-__"
                            required 
                            aria-required="true"
                            disabled={isSubmitting || (session && !!userProfile?.phone)}
                        />
                    </div>
                    <button 
                        className="booking-confirm-button" 
                        onClick={handleBookingConfirm}
                        disabled={!finalSelectedDate || !finalSelectedTime || !clientName.trim() || !clientPhone.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Обработка...' : 'Записаться'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default ServiceList;