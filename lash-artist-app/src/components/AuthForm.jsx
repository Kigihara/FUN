// src/components/AuthForm.jsx
import React, { useState } from 'react';
import './AuthForm.css'; // Создадим этот файл для стилей

function AuthForm({ title, buttonText, onSubmit, isSignUp = false, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Только для регистрации
  const [phone, setPhone] = useState('');     // Только для регистрации

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      onSubmit({ email, password, fullName, phone });
    } else {
      onSubmit({ email, password });
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-form-title">{title}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {isSignUp && (
          <>
            <div className="form-group-auth">
              <label htmlFor="fullName">Полное имя</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group-auth">
              <label htmlFor="phone">Телефон</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
          </>
        )}
        <div className="form-group-auth">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group-auth">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6" // Supabase по умолчанию требует минимум 6 символов
            disabled={loading}
          />
        </div>
        {error && <p className="auth-error-message">{error}</p>}
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Обработка...' : buttonText}
        </button>
      </form>
    </div>
  );
}

export default AuthForm;