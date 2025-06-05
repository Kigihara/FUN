import React from 'react';
import './AboutMe.css';

// Ссылка на фото мастера (из Google Drive)
// Важно: Для Google Drive ссылка должна быть прямой ссылкой на файл, а не на страницу предпросмотра.
// Обычно это требует изменения URL. Если будут проблемы с отображением, нам нужно будет получить прямую ссылку.
// Пока что, если возникнут проблемы, браузер может блокировать из-за CORS или неправильного формата ссылки.
// Идеально - загрузить фото на хостинг или в Supabase Storage и использовать прямую ссылку оттуда.
const masterImageUrl = 'https://vndlykutumwmgojgtnxj.supabase.co/storage/v1/object/public/avatar-artist//vTlRvezgNDg.jpg';

// Иконки для преимуществ (можно подобрать из Feather Icons или аналогичных)
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="advantage-icon">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);


function AboutMe() {
  const masterName = "Диана";
  const experienceYears = "10+ лет";
  const aboutText = `Приветствую вас! Меня зовут ${masterName}, и уже более ${experienceYears} я с любовью и профессионализмом создаю безупречные взгляды. Моя миссия – не просто нарастить ресницы, а подчеркнуть вашу уникальную красоту, подарить уверенность и то самое ощущение неотразимости, когда вы смотрите в зеркало. Для меня каждая из вас – особенная, поэтому я всегда уделяю максимум внимания индивидуальному подбору эффекта, изгиба и длины ресниц, учитывая ваши пожелания и природные данные. В работе я использую только сертифицированные материалы премиум-класса от ведущих мировых брендов, гарантирующие не только великолепный результат, но и абсолютную безопасность для ваших глаз и натуральных ресниц. Мой кабинет – это место, где вы можете расслабиться, довериться опытному мастеру и получить не только красивые ресницы, но и заряд положительных эмоций.`;
  
  const advantages = [
    { text: `${experienceYears} опыта: Глубокие знания и отточенное мастерство.` },
    { text: "Премиум-материалы: Только лучшее для вашей красоты и здоровья." },
    { text: "Индивидуальный подход: Взгляд, созданный именно для вас." },
    { text: "Безопасность и комфорт: Строгое соблюдение стандартов." }
  ];

  return (
    <section id="about-me" className="about-me-section">
      <div className="container about-me-container">
        <div className="about-me-image-wrapper">
          <img src={masterImageUrl} alt={`Мастер по наращиванию ресниц - ${masterName}`} className="about-me-image" />
        </div>
        <div className="about-me-content">
          <h2 className="about-me-title">Знакомьтесь, Ваш Мастер – {masterName}</h2>
          <p className="about-me-text">{aboutText}</p>
          <h3 className="advantages-title">Почему выбирают меня:</h3>
          <ul className="advantages-list">
            {advantages.map((advantage, index) => (
              <li key={index} className="advantage-item">
                <CheckCircleIcon />
                <span>{advantage.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AboutMe;