import React from 'react';
import './Contact.css';

// SVG иконки (можно вынести в отдельный файл/компоненты позже, если их станет много)
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const ClockIconContact = () => ( // Немного другая иконка часов для этого раздела
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

function Contact() {
  const address = "г. Воображаемый, ул. Ресничная, д. 15, офис 7";
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const phone = "+7 (987) 654-32-10";
  const email = "hello@lashdream.studio";

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <h2 className="contact-section-title">Свяжитесь с нами</h2>
        <p className="contact-section-subtitle">
          Мы всегда рады ответить на ваши вопросы и помочь с записью.
        </p>

        <div className="contact-content-wrapper">
          <div className="contact-details">
            <div className="contact-item">
              <MapPinIcon />
              <div className="contact-item-text">
                <h4>Адрес:</h4>
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                  {address}
                </a>
              </div>
            </div>

            <div className="contact-item">
              <PhoneIcon />
              <div className="contact-item-text">
                <h4>Телефон:</h4>
                <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              </div>
            </div>

            <div className="contact-item">
              <MailIcon />
              <div className="contact-item-text">
                <h4>Email:</h4>
                <a href={`mailto:${email}`}>{email}</a>
              </div>
            </div>
            
            <div className="contact-item">
              <ClockIconContact />
              <div className="contact-item-text">
                <h4>Часы работы:</h4>
                <p>Пн - Пт: 10:00 – 20:00</p>
                <p>Сб: 11:00 – 18:00</p>
                <p>Вс: Выходной</p>
              </div>
            </div>
          </div>

          {/* Место для карты (если будем добавлять позже) */}
          {/* <div className="contact-map-placeholder">
            <p>Здесь будет карта</p>
          </div> */}
        </div>
      </div>
    </section>
  );
}

export default Contact;