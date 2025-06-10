// src/App.jsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceList from './components/ServiceList';
import AboutMe from './components/AboutMe';
import Contact from './components/Contact';
import AuthPage from './pages/AuthPage';
import MasterScheduleManager from './pages/MasterScheduleManager';
import { Icon24LogoVk } from '@vkontakte/icons';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false); // <--- Функция называется setAuthLoading
  const [currentView, setCurrentView] = useState('client');

  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAuthModal]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          if (!session) {
            setCurrentView('client');
          }
        }
      );
      
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    });
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
    } else {
      setUserProfile(null);
    }
  }, [session]);

  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data || null);
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
      toast.error('Не удалось загрузить профиль.');
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
      toast.success('С возвращением!');
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
         toast.success('Регистрация почти завершена! Проверьте почту для подтверждения.');
      } else {
         toast.success('Регистрация успешна!');
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
    setAuthLoading(true);
    await supabase.auth.signOut();
    toast.success('Вы успешно вышли из системы.');
    setAuthLoading(false);
  };
  
  const handleShowAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setShowAuthModal(true);
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

  const showMasterPanel = () => setCurrentView('master');
  const showClientView = () => setCurrentView('client');

  const viewVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: { background: '#ffffff', color: '#424242', fontFamily: "'Open Sans', sans-serif", fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' },
          success: { iconTheme: { primary: '#FAD2E1', secondary: '#fff' } },
          error: { iconTheme: { primary: '#D32F2F', secondary: '#fff' } }
        }}
      />

      <header className="app-header">
        <Navbar 
          session={session} 
          userProfile={userProfile}
          onShowAuthModal={handleShowAuthModal} 
          onLogout={handleLogout}
          authLoading={authLoading}
          onShowMasterPanel={showMasterPanel}
          onShowClientView={showClientView}
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
                  initialMode={authMode}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  error={authError}
                  loading={authLoading}
                  setAuthError={setAuthError}
                  setLoading={setAuthLoading} // <<< ИСПРАВЛЕНО ЗДЕСЬ
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {currentView === 'master' && session && userProfile?.role === 'master' ? (
          <motion.div
            key="master-view"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={viewVariants}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <MasterScheduleManager />
          </motion.div>
        ) : (
          <motion.div
            key="client-view"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={viewVariants}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <Hero />
            <main className="app-main">
              <div className="container">
                <ServiceList userProfile={userProfile} session={session} />
              </div>
              <AboutMe />
              <Contact />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      
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