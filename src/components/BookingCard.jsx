import React from 'react';
import './BookingCard.css';
import { motion } from 'framer-motion';

// Иконки
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const PhoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);

// Карта статусов для красивого отображения
const statusMap = {
  pending: { text: 'Ожидает', className: 'pending' },
  confirmed: { text: 'Подтверждена', className: 'confirmed' },
  cancelled_by_master: { text: 'Отменена мастером', className: 'cancelled' },
  cancelled_by_client: { text: 'Отменена клиентом', className: 'cancelled' },
  completed: { text: 'Завершена', className: 'completed' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

function BookingCard({ booking, onStatusUpdate, isSubmitting }) {
  const formattedDate = new Date(booking.booking_date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short'
  });
  const formattedDayOfWeek = new Date(booking.booking_date).toLocaleDateString('ru-RU', { weekday: 'short' });
  const serviceName = booking.services?.name || 'Услуга не найдена';
  const statusInfo = statusMap[booking.status] || { text: booking.status, className: '' };

  return (
    <motion.div 
      className={`booking-card-v2 status-${statusInfo.className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className="booking-v2-date-section">
        <span className="booking-v2-day">{formattedDate.split(' ')[0]}</span>
        <span className="booking-v2-month">{formattedDate.split(' ')[1]}</span>
        <span className="booking-v2-weekday">{formattedDayOfWeek}</span>
      </div>

      <div className="booking-v2-main-info">
        <div className="booking-v2-header">
            <span className="booking-v2-time">{booking.booking_start_time.slice(0, 5)}</span>
            <h4 className="booking-v2-service-name">{serviceName}</h4>
        </div>
        <div className="booking-v2-client-info">
            <span className="booking-v2-info-item"><UserIcon /> {booking.client_name}</span>
            <span className="booking-v2-info-item"><PhoneIcon /> <a href={`tel:${booking.client_phone}`}>{booking.client_phone}</a></span>
        </div>
      </div>

      <div className="booking-v2-actions-status">
        {booking.status === 'pending' ? (
          <div className="booking-v2-actions">
            <button
              className="action-v2-btn confirm"
              onClick={() => onStatusUpdate(booking.id, 'confirmed')}
              disabled={isSubmitting}
            >
              Подтвердить
            </button>
            <button
              className="action-v2-btn cancel"
              onClick={() => onStatusUpdate(booking.id, 'cancelled_by_master')}
              disabled={isSubmitting}
            >
              Отклонить
            </button>
          </div>
        ) : (
          <span className={`booking-v2-status-pill status-${statusInfo.className}`}>{statusInfo.text}</span>
        )}
      </div>
    </motion.div>
  );
}

export default BookingCard;