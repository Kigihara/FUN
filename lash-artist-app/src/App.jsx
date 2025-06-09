// src/App.jsx
// eslint-disable-next-line no-unused-vars

// src/App.jsx
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceList from './components/ServiceList';
import AboutMe from './components/AboutMe';
import Contact from './components/Contact';
import AuthPage from './pages/AuthPage';
import { Icon24LogoVk } from '@vkontakte/icons';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false); // 'login', 'signup', 'updatePassword'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log(`[App onAuthStateChange] Event: ${_event}, Session:`, session);
        setSession(session);

        // Если пришло событие PASSWORD_RECOVERY, открываем модальное окно в режиме обновления пароля
        if (_event === "PASSWORD_RECOVERY") {
          setShowAuthModal('updatePassword');
          // Очищаем хэш из URL, чтобы ссылка не использовалась повторно
          if (window.history.replaceState) {
            const cleanURL = window.location.href.split('#')[0];
            window.history.replaceState(null, null, cleanURL);
          } else {
            window.location.hash = ''; 
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      if (!userProfile || userProfile.id !== session.user.id) {
        fetchUserProfile(session.user.id);
      }
    } else {
      setUserProfile(null);
    }
  }, [session, userProfile]);

  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data || null);
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
      setUserProfile(null);
    }
  };

  const handleLogin = async (credentials) => {
    await handleAuthOperation(() => supabase.auth.signInWithPassword(credentials));
  };

  const handleSignup = async (credentials) => {
    const { email, password, fullName, phone } = credentials;
    await handleAuthOperation(() => supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone } },
    }), 'signup');
  };

  const handleAuthOperation = async (authFunction, operationType = 'login') => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await authFunction();
      if (error) throw error;
      
      if (operationType === 'signup' && data.user && !data.session) {
        alert('Регистрация почти завершена! Проверьте почту для подтверждения email.');
      }
      // При успешном входе или регистрации с авто-подтверждением, onAuthStateChange обновит сессию, 
      // и модальное окно закроется.
      setShowAuthModal(false);
    } catch (error) {
      if (error.message.includes("User already registered")) {
        setAuthError('Пользователь с таким email уже зарегистрирован.');
      } else if (error.message.includes("Invalid login credentials")) {
        setAuthError('Неверный email или пароль.');
      } else {
        setAuthError(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
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

      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            className="auth-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !authLoading && setShowAuthModal(false)}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: -30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <AuthPage
                  initialMode={showAuthModal}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  error={authError}
                  loading={authLoading}
                  setAuthError={setAuthError}
                  setLoading={setAuthLoading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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