// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceList from './components/ServiceList';
import AboutMe from './components/AboutMe';
import Contact from './components/Contact';
import AuthForm from './components/AuthForm';
import { Icon24LogoVk } from '@vkontakte/icons'; // Убедись, что используешь или удали
import './App.css';

function App() {
  console.log('[App] Component rendering or re-rendering');

  const [session, setSession] = useState(null); 
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true); 

  useEffect(() => {
    console.log('[App useEffect] Running effect to set up auth listener.');
    setAppLoading(true); 

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (sessionError) {
        console.error('[App useEffect] Error getting initial session:', sessionError);
      }
      console.log('[App useEffect] Initial session data:', initialSession);
      setSession(initialSession);
      
      let profileFetchedForInitial = false;
      const initialUser = initialSession?.user;

      if (initialUser) {
        fetchUserProfile(initialUser.id).then(() => {
          profileFetchedForInitial = true;
          // setAppLoading(false) будет вызван ниже или в onAuthStateChange
        });
      }

      // 2. Set up onAuthStateChange listener
      console.log('[App useEffect] Setting up onAuthStateChange listener.');
      const { data: authListenerData, error: authListenerSetupError } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          console.log(`[App onAuthStateChange] Event: ${_event}, Current Session:`, currentSession);
          
          // Сравниваем новую сессию со старой, чтобы избежать лишних вызовов fetchUserProfile, если сессия не изменилась
          // Это актуально, если onAuthStateChange может вызываться с той же сессией несколько раз
          const prevSessionUserId = session?.user?.id; // Используем опциональную цепочку на предыдущем session
          const currentSessionUserId = currentSession?.user?.id;

          setSession(currentSession); // Всегда обновляем сессию
          
          if (currentSessionUserId && currentSessionUserId !== prevSessionUserId) {
            console.log('[App onAuthStateChange] Session user changed or new session, fetching profile for user:', currentSessionUserId);
            await fetchUserProfile(currentSessionUserId);
          } else if (!currentSessionUserId && userProfile !== null) { // Если сессия стала null, а профиль был
            console.log('[App onAuthStateChange] Session is now null, clearing profile.');
            setUserProfile(null);
          } else if (currentSessionUserId && !userProfile && _event !== "INITIAL_SESSION" && _event !== "TOKEN_REFRESHED") {
            // Если сессия есть, но профиля нет (и это не initial session или token refresh, где fetchUserProfile уже мог быть вызван)
            console.log('[App onAuthStateChange] Session exists, but no profile, attempting to fetch for:', currentSessionUserId);
            await fetchUserProfile(currentSessionUserId);
          }


          if (appLoading) { 
             setAppLoading(false);
             console.log('[App onAuthStateChange] Setting appLoading to false.');
          }
        }
      );

      if (authListenerSetupError) {
        console.error("[App useEffect] Error setting up onAuthStateChange listener:", authListenerSetupError);
        setAppLoading(false); 
      } else {
        console.log("[App useEffect] onAuthStateChange listener set up successfully. Subscription data:", authListenerData);
        // Если начальной сессии не было, onAuthStateChange сработает с currentSession=null и установит appLoading в false.
        // Если начальная сессия была, и профиль для нее уже загружен (profileFetchedForInitial = true),
        // и onAuthStateChange еще не сбросил appLoading, то сбрасываем.
        if (!initialUser && appLoading) { 
            setAppLoading(false);
            console.log('[App useEffect] No initial session, setting appLoading to false.');
        } else if (initialUser && profileFetchedForInitial && appLoading){
            setAppLoading(false);
            console.log('[App useEffect] Initial session and profile processed, setting appLoading to false.');
        }
      }
      
      return () => {
        console.log("[App useEffect Cleanup] Cleaning up auth listener.");
        if (authListenerData && typeof authListenerData.subscription?.unsubscribe === 'function') {
          console.log("[App useEffect Cleanup] Unsubscribing from auth state changes.");
          authListenerData.subscription.unsubscribe();
        } else {
          console.warn("[App useEffect Cleanup] Could not unsubscribe.", authListenerData);
        }
      };
    }).catch(error => {
        console.error("[App useEffect] Error in initial getSession promise chain:", error);
        setAppLoading(false);
    });
  }, []); // Пустой массив зависимостей

  const fetchUserProfile = async (userId) => {
    if (!userId) {
      console.log('[fetchUserProfile] No userId provided, setting profile to null.');
      setUserProfile(null);
      return;
    }
    console.log(`[fetchUserProfile] Attempting to fetch profile for userId: ${userId}`);
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log(`[fetchUserProfile] Supabase response for userId ${userId}: Status ${status}, Error:`, error, "Data:", data);
      if (error && status !== 406) { 
        console.error(`[fetchUserProfile] Error fetching profile for ${userId}:`, error);
        setUserProfile(null); 
      } else if (data) {
        console.log(`[fetchUserProfile] Profile data found for ${userId}:`, data);
        setUserProfile(data);
      } else {
        console.log(`[fetchUserProfile] No profile data found for ${userId} (status ${status}). Setting profile to null.`);
        setUserProfile(null); 
      }
    } catch (e) {
      console.error(`[fetchUserProfile] Unexpected exception for ${userId}:`, e);
      setUserProfile(null); 
    }
  };

  const handleLogin = async ({ email, password }) => {
    console.log(`[handleLogin] Attempting login for email: ${email}`);
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[handleLogin] signInWithPassword response. Error:', error, 'Data:', data);
      if (error) throw error;
      setShowAuthModal(false); 
    } catch (error) {
      console.error('[handleLogin] Error:', error.message);
      setAuthError(error.message);
    } finally {
      console.log('[handleLogin] Setting authLoading to false.');
      setAuthLoading(false);
    }
  };

  const handleSignup = async ({ email, password, fullName, phone }) => {
    console.log(`[handleSignup] Attempting signup for email: ${email}`);
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data: signUpResponse, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: phone } }
      });
      console.log('[handleSignup] signUp response. Error:', error, 'Data:', signUpResponse);
      if (error) throw error;
      
      const currentAuthSession = (await supabase.auth.getSession()).data.session;

      if (signUpResponse.user && signUpResponse.user.identities && signUpResponse.user.identities.length === 0) {
         console.warn('[handleSignup] User object returned but identities array is empty.');
         setAuthError('Не удалось завершить регистрацию. Возможно, email уже используется.');
      } else if (signUpResponse.user && !signUpResponse.user.email_confirmed_at && !currentAuthSession ) {
         console.log('[handleSignup] Signup successful, email confirmation pending.');
         alert('Регистрация почти завершена! Пожалуйста, проверьте вашу почту для подтверждения email.');
      } else {
         console.log('[handleSignup] Signup successful.');
         alert('Регистрация успешна!');
      }
      setShowAuthModal(false);
    } catch (error) {
      console.error('[handleSignup] Error:', error.message, error);
      if (error.message.includes("User already registered")) {
        setAuthError('Пользователь с таким email уже зарегистрирован.');
      } else if (error.message.includes("Password should be at least 6 characters")) { 
        setAuthError('Пароль должен содержать не менее 6 символов.');
      } else {
        setAuthError(error.message || 'Произошла ошибка регистрации.');
      }
    } finally {
      console.log('[handleSignup] Setting authLoading to false.');
      setAuthLoading(false);
    }
  };

  const handleLogout = () => { 
    console.log("[handleLogout] Called. Setting authLoading to true.");
    setAuthLoading(true);
    setAuthError('');
  
    console.log("[handleLogout] Attempting supabase.auth.signOut()...");
    supabase.auth.signOut()
      .then((response) => { 
        console.log("[handleLogout] signOut().then() was called. Response:", response);
        if (response.error) {
          console.error('[handleLogout] Error from signOut in .then():', response.error.message, response.error);
          setAuthError('Ошибка выхода: ' + response.error.message);
        } else {
          console.log("[handleLogout] signOut successful (according to .then()). onAuthStateChange should handle UI update.");
        }
      })
      .catch((catchError) => {
        console.error('[handleLogout] signOut().catch() was called. Caught error:', catchError);
        setAuthError('Неожиданная ошибка при выходе: ' + (catchError.message || catchError));
      })
      .finally(() => {
        console.log("[handleLogout] signOut().finally() was called. Setting authLoading to false.");
        setAuthLoading(false);
      });
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

  if (appLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontFamily: "'Montserrat', sans-serif", color: "#424242" }}>Загрузка приложения...</div>;
  }

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

      {/* Я уберу тестовую кнопку выхода отсюда, так как она была только для диагностики */}
      {/* Если она нужна, можешь раскомментировать */}
      {/* {session && ( ... тестовая кнопка ... )} */}

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
           <div className="social-links"> {/* Восстановленный блок SocialLinks */}
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