// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceList from './components/ServiceList';
import AboutMe from './components/AboutMe';
import Contact from './components/Contact';
import AuthForm from './components/AuthForm';
import { Icon24LogoVk } from '@vkontakte/icons';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  // Убрали все состояния, связанные с загрузкой приложения (appLoading, initialLoading, etc.)

  console.log('[App] Render. Session:', !!session, 'Profile:', !!userProfile);

  // Единственный useEffect для управления сессией.
  useEffect(() => {
    // 1. Устанавливаем слушатель onAuthStateChange.
    // Он будет срабатывать при входе, выходе, обновлении токена,
    // и САМОЕ ВАЖНОЕ - он сработает один раз при загрузке с событием INITIAL_SESSION,
    // которое несет текущую сессию из localStorage.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log(`[App onAuthStateChange] Event: ${_event}, Session:`, currentSession);
        setSession(currentSession);
      }
    );

    // 2. Функция очистки для отписки от слушателя при размонтировании компонента.
    return () => {
      console.log('[App useEffect Cleanup] Cleaning up listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Пустой массив зависимостей гарантирует, что этот эффект запустится один раз.

  // Второй useEffect, который реагирует на ИЗМЕНЕНИЕ сессии.
  useEffect(() => {
    console.log('[App Session useEffect] Session state changed:', session);
    if (session?.user) {
      // Если сессия есть и в ней есть пользователь, загружаем профиль.
      // Проверяем, чтобы не запрашивать профиль снова, если он уже есть для этого пользователя.
      if (!userProfile || userProfile.id !== session.user.id) {
        fetchUserProfile(session.user.id);
      }
    } else {
      // Если сессии нет (например, после выхода), очищаем профиль.
      setUserProfile(null);
    }
  }, [session]); // Этот эффект зависит только от `session`.

  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    console.log(`[fetchUserProfile] Attempting to fetch profile for userId: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      console.log(`[fetchUserProfile] Profile data found for ${userId}:`, data);
      setUserProfile(data || null);
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
      setUserProfile(null);
    }
  };

  const handleLogin = async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async ({ email, password, fullName, phone }) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data: signUpResponse, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: phone } },
      });
      if (error) throw error;
      
      if (signUpResponse.user && !signUpResponse.session) {
         alert('Регистрация почти завершена! Пожалуйста, проверьте вашу почту для подтверждения email.');
      } else {
         alert('Регистрация успешна!');
      }
      setShowAuthModal(false);
    } catch (error) {
      if (error.message.includes("User already registered")) {
        setAuthError('Пользователь с таким email уже зарегистрирован.');
      } else {
        setAuthError(error.message || 'Произошла ошибка регистрации.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("[handleLogout] Attempting to sign out...");
    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Ошибка выхода:", error.message);
      alert("Ошибка выхода: " + error.message);
    } else {
      console.log("[handleLogout] Sign out successful.");
    }
    setAuthLoading(false);
  };
  
  const SocialLinks = () => (
    <div className="social-links">
      <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
      </a>
      <a href="https://telegram.org/" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </a>
      <a href="https://vk.com/" target="_blank" rel="noopener noreferrer" aria-label="VK">
        <Icon24LogoVk width={27.5} height={27.5} /> 
      </a>
    </div>
  );

  return (
    <>
      <header className="app-header">
        <Navbar 
          session={session} 
          userProfile={userProfile}
          onShowAuthModal={setShowAuthModal} 
          onLogout={handleLogout}
          authLoading={authLoading}
        />
      </header>

      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => !authLoading && setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
                className="auth-modal-close-button" 
                onClick={() => !authLoading && setShowAuthModal(false)}
                disabled={authLoading}
                aria-label="Закрыть окно аутентификации"
            >×</button>
            {showAuthModal === 'login' && (
              <AuthForm
                title="Вход"
                buttonText="Войти"
                onSubmit={handleLogin}
                error={authError}
                loading={authLoading}
              />
            )}
            {showAuthModal === 'signup' && (
              <AuthForm
                title="Регистрация"
                buttonText="Зарегистрироваться"
                onSubmit={handleSignup}
                isSignUp={true}
                error={authError}
                loading={authLoading}
              />
            )}
          </div>
        </div>
      )}
      
      <Hero />
      <main className="app-main">
        <div className="container">
          <ServiceList userProfile={userProfile} session={session} />
        </div>
        <AboutMe />
        <Contact />
      </main>
      
      <footer className="app-footer">
        <div className="container footer-container">
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} LashDream Studio. Все права защищены.</p>
          </div>
          <SocialLinks />
          <div className="footer-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Политика конфиденциальности</a>
            <span className="footer-link-divider">|</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Условия использования</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;