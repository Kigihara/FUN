// src/App.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiMail, FiLock, FiLogIn, FiUserPlus, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiHelpCircle, FiLogOut, FiSend, FiKey } from 'react-icons/fi';
import { supabase } from './supabaseClient';
import ParticlesBackground from './components/ParticlesBackground';
import DashboardPage from './pages/DashboardPage';
import SingleBoardPage from './pages/SingleBoardPage';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'; // Убрали useNavigate

// --- Styled Components и ключевые кадры ---
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const AppContainer = styled(motion.div)`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0; 
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
  position: relative;
  overflow-x: hidden; 
  perspective: 1200px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-image: url('/noise.svg');
    background-repeat: repeat;
    pointer-events: none;
    z-index: 0; 
  }
`;

const AuthPageWrapper = styled(motion.div)`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;
`;

const StyledAuthCard = styled(motion.div)`
  width: 100%;
  max-width: 420px;
  padding: 40px 35px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2; 
  position: relative;
`;

const Form = styled(motion.form)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const InputWrapper = styled(motion.div)`
  position: relative;
  width: 100%;
`;

const InputLabel = styled(motion.label)`
  position: absolute;
  left: 55px;
  top: 17px;
  font-size: 1rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
  transition: all 0.2s ease-out;
  white-space: nowrap;
`;

const InputField = styled(motion.input)`
  width: 100%;
  padding: 22px 20px 10px 55px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  outline: none;
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus + ${InputLabel},
  &:not(:placeholder-shown) + ${InputLabel} {
    top: 6px;
    font-size: 0.75rem;
    color: #fff;
    font-weight: 500;
  }
  
  &::placeholder {
    color: transparent; 
  }

  &:focus {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(231, 60, 126, 0.25);
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover, 
  &:-webkit-autofill:focus, 
  &:-webkit-autofill:active {
    -webkit-text-fill-color: #fff !important;
    -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.18) inset !important;
    transition: background-color 5000s ease-in-out 0s;
    caret-color: #fff !important;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
`;

const InputIcon = styled.span`
  position: absolute;
  left: 20px;
  top: 18px;
  transform: translateY(0);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  pointer-events: none;
  transition: color 0.3s ease;
  z-index: 1;

  ${InputWrapper}:focus-within & {
    color: #fff;
  }
`;

const spinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled(motion.div)`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spinnerAnimation} 0.8s linear infinite;
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 16px 20px;
  background: linear-gradient(90deg, #f06388 0%, #e73c7e 50%, #d81159 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.2s ease-out, box-shadow 0.3s ease-out, background-position 0.5s ease, opacity 0.3s ease;
  box-shadow: 0 5px 20px rgba(231, 60, 126, 0.25);
  background-size: 200% auto;
  margin-top: 10px;
  position: relative; 
  overflow: hidden;

  ${props => props.disabled && `
    cursor: not-allowed;
  `}

  &:hover:not(:disabled) {
    background-position: right center;
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 25px rgba(231, 60, 126, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px) scale(0.98);
    box-shadow: 0 3px 10px rgba(231, 60, 126, 0.2);
  }

  &:disabled {
    opacity: 0.8; 
    cursor: not-allowed;
  }
`;

const ButtonContent = styled(motion.span)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const LinksContainer = styled(motion.div)`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const StyledLink = styled(motion.a)`
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease, transform 0.2s ease;
  cursor: pointer;

  &:hover {
    color: #fff;
    transform: translateY(-1px);
  }
`;

const Message = styled(motion.p)`
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  margin-top: -10px; 
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 10px;
  width: 100%;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);

  &.error {
    color: #ffffff;
    background-color: rgba(255, 77, 77, 0.6);
    border: 1px solid rgba(255, 77, 77, 0.8);
    box-shadow: 0 2px 8px rgba(255, 77, 77, 0.3);
  }

  &.success {
    color: #ffffff;
    background-color: rgba(82, 196, 26, 0.65);
    border: 1px solid rgba(82, 196, 26, 0.8);
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  }
`;
// --- Конец Styled Components ---

const AuthPage = ({ onAuthSuccess, initialAuthMode = 'signIn', onPasswordUpdated }) => {
  const [authMode, setAuthMode] = useState(initialAuthMode); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (initialAuthMode !== authMode) {
        setAuthMode(initialAuthMode);
    }
    if (initialAuthMode !== 'updatePassword' || !message.text ) {
        if (!(authMode === 'updatePassword' && message.type === 'error')) {
            // setMessage({ text: '', type: '' });
        }
    }
  }, [initialAuthMode]); 

  useEffect(() => {
    if (authMode !== 'updatePassword' && !(authMode === 'signIn' && message.type === 'success' && message.text.includes("Пароль успешно обновлен"))) {
        if(!loading && message.text && (message.text.includes("Пожалуйста, введите") || message.text.includes("Пароли не совпадают") || message.text.includes("Пароль должен содержать"))) {
            // не сбрасывать
        } else {
            setMessage({ text: '', type: '' });
        }
    }
  }, [authMode]); 


  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth) - 0.5);
      mouseY.set((clientY / innerHeight) - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);
  const springConfig = { damping: 30, stiffness: 150, restDelta: 0.001 };
  const springMouseX = useSpring(mouseX, springConfig);
  const springMouseY = useSpring(mouseY, springConfig);
  const rotateX = useTransform(springMouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springMouseX, [-0.5, 0.5], [-4, 4]);
  const translateX = useTransform(springMouseX, [-0.5, 0.5], [-2, 2]);
  const translateY = useTransform(springMouseY, [-0.5, 0.5], [-2, 2]);

  const formVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.5 }},
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 13, duration: 0.4 }},
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    let authResponse = null;

    if (authMode === 'signUp') {
      if (password.length < 6) { setMessage({ text: 'Пароль должен содержать не менее 6 символов.', type: 'error' }); setLoading(false); return; }
      authResponse = await supabase.auth.signUp({ email, password });
    } else if (authMode === 'signIn') {
      authResponse = await supabase.auth.signInWithPassword({ email, password });
    } else if (authMode === 'updatePassword') {
      if (password.length < 6) { setMessage({ text: 'Новый пароль должен содержать не менее 6 символов.', type: 'error' }); setLoading(false); return; }
      if (password !== confirmPassword) { setMessage({ text: 'Пароли не совпадают.', type: 'error' }); setLoading(false); return; }
      authResponse = await supabase.auth.updateUser({ password: password });
    }

    setLoading(false);
    if (!authResponse) return;
    const { data, error } = authResponse;

    if (error) {
      console.error(`Ошибка ${authMode}:`, error);
      if (authMode === 'signUp') {
        if (error.message.includes("User already registered")) setMessage({ text: 'Пользователь с таким email уже зарегистрирован.', type: 'error' });
        else if (error.message.includes("Password should be at least 6 characters")) setMessage({ text: 'Пароль должен содержать не менее 6 символов.', type: 'error' });
        else setMessage({ text: 'Ошибка регистрации. Пожалуйста, проверьте данные.', type: 'error' });
      } else if (authMode === 'signIn') {
        if (error.message === 'Invalid login credentials') setMessage({ text: 'Неверный email или пароль.', type: 'error' });
        else if (error.message.includes("Email not confirmed")) setMessage({ text: 'Ваш email еще не подтвержден.', type: 'error' });
        else setMessage({ text: 'Ошибка входа. Пожалуйста, проверьте данные.', type: 'error' });
      } else if (authMode === 'updatePassword') {
         if (error.message.includes("New password should be different from the old password")) {
            setMessage({ text: 'Новый пароль должен отличаться от вашего текущего пароля. Пожалуйста, придумайте другой.', type: 'error' });
         } else if (error.message.includes("Auth session missing") || error.message.includes("Invalid Session")) {
            setMessage({ text: 'Сессия для обновления пароля недействительна или истекла. Пожалуйста, запросите сброс пароля снова.', type: 'error' });
         } else {
            setMessage({ text: 'Не удалось обновить пароль. Попробуйте снова.', type: 'error' });
         }
      }
    } else if (data.user || (authMode === 'updatePassword' && data && Object.keys(data).length > 0 && !error) ) {
      if (authMode === 'signUp' && !data.session) { 
        setMessage({ text: 'Регистрация успешна! Проверьте почту для подтверждения.', type: 'success' });
      } else if (authMode === 'updatePassword') {
        setMessage({ text: 'Пароль успешно обновлен! Теперь вы можете войти с новым паролем.', type: 'success' });
        setPassword(''); 
        setConfirmPassword('');
        if (onPasswordUpdated) onPasswordUpdated();
      }
      else { 
        if(onAuthSuccess) onAuthSuccess(data.user);
      }
    } else if (authMode === 'signUp' && !error && !data.user && data.session === null) {
        setMessage({ text: 'Регистрация успешна! Проверьте почту для подтверждения.', type: 'success' });
    }
    else {
       setMessage({ text: 'Произошла неизвестная ошибка.', type: 'error' });
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    if (!email) { setMessage({ text: 'Пожалуйста, введите ваш email.', type: 'error' }); return; }
    setLoading(true);
    setMessage({ text: '', type: '' }); 
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split('#')[0], 
    });
    setLoading(false); 
    if (error) {
      console.error('Ошибка запроса сброса пароля:', error);
      if (error.message.includes("For security purposes")) { setMessage({ text: 'Ссылка уже отправлена или запрошена недавно. Проверьте почту или попробуйте позже.', type: 'error' }); }
      else if (error.message.includes("Unable to validate email address: invalid format")) { setMessage({ text: 'Неверный формат email адреса.', type: 'error' }); }
      else { setMessage({ text: 'Если такой email зарегистрирован, ссылка для сброса пароля отправлена. Проверьте почту (включая папку "Спам").', type: 'success' }); }
    } else {
      setMessage({ text: 'Ссылка для сброса пароля отправлена на ваш email. Проверьте почту (включая папку "Спам").', type: 'success' });
    }
  };
  
  const emailInputId = "email-main";
  const passwordInputId = "password-main";
  const confirmPasswordInputId = "confirm-password-main";
  const emailResetInputId = "email-reset";

  const switchToMode = (e, newMode) => {
    e.preventDefault();
    const previousEmail = (authMode === 'updatePassword' && newMode === 'signIn') ? email : '';
    setAuthMode(newMode);
    if (previousEmail) { setEmail(previousEmail); } 
    else if (newMode !== 'resetPassword' && newMode !== 'updatePassword') { setEmail(''); }
    setPassword('');
    setConfirmPassword('');
  };

  let cardTitle = "Добро пожаловать!";
  if (authMode === 'signUp') cardTitle = "Создать аккаунт";
  if (authMode === 'resetPassword') cardTitle = "Сброс пароля";
  if (authMode === 'updatePassword') cardTitle = "Обновить пароль";

  return (
    <StyledAuthCard style={{ rotateX, rotateY, translateX, translateY }} initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} key={authMode} >
      <motion.h2 style={{ color: 'white', marginBottom: '25px', fontSize: '2.5rem', fontWeight: '700', letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }} variants={itemVariants} >
        {cardTitle}
      </motion.h2>
      {message.text && ( <Message className={message.type} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} > {message.type === 'error' && <FiAlertCircle size={18} style={{ marginRight: '5px', flexShrink: 0 }}/>} {message.type === 'success' && <FiCheckCircle size={18} style={{ marginRight: '5px', flexShrink: 0 }}/>} {message.text} </Message> )}
      {authMode === 'resetPassword' ? (
        <Form onSubmit={handlePasswordResetRequest} variants={formVariants} initial="hidden" animate="visible">
          <InputWrapper variants={itemVariants}> <InputIcon><FiMail /></InputIcon> <InputField id={emailResetInputId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder=" " disabled={loading} /> <InputLabel htmlFor={emailResetInputId}>Ваш Email для сброса</InputLabel> </InputWrapper>
          <SubmitButton type="submit" variants={itemVariants} disabled={loading}> <AnimatePresence mode="wait" initial={false}> {loading ? ( <Spinner key="spinner-reset"/> ) : ( <ButtonContent key="content-reset"> <FiSend /> Отправить ссылку </ButtonContent> )} </AnimatePresence> </SubmitButton>
          <StyledLink href="#" onClick={(e) => switchToMode(e, 'signIn')} style={{ alignSelf: 'center', marginTop: '10px' }}> <FiArrowLeft size={16} /> Вернуться ко входу </StyledLink>
        </Form>
      ) : authMode === 'updatePassword' ? (
        <Form onSubmit={handleAuthAction} variants={formVariants} initial="hidden" animate="visible">
           <p style={{color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: '0.9rem', marginTop: '-10px', marginBottom: '10px'}}> Введите новый пароль. </p>
          <InputWrapper variants={itemVariants}> <InputIcon><FiLock /></InputIcon> <InputField id={passwordInputId} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder=" " disabled={loading} /> <InputLabel htmlFor={passwordInputId}>Новый пароль</InputLabel> </InputWrapper>
          <InputWrapper variants={itemVariants}> <InputIcon><FiLock /></InputIcon> <InputField id={confirmPasswordInputId} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder=" " disabled={loading} /> <InputLabel htmlFor={confirmPasswordInputId}>Подтвердите пароль</InputLabel> </InputWrapper>
          <SubmitButton type="submit" variants={itemVariants} disabled={loading}> <AnimatePresence mode="wait" initial={false}> {loading ? ( <Spinner key="spinner-update"/> ) : ( <ButtonContent key="content-update"> <FiKey /> Обновить пароль </ButtonContent> )} </AnimatePresence> </SubmitButton>
        </Form>
      ) : (
        <Form onSubmit={handleAuthAction} variants={formVariants} initial="hidden" animate="visible">
          <InputWrapper variants={itemVariants}> <InputIcon><FiMail /></InputIcon> <InputField id={emailInputId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder=" " disabled={loading} /> <InputLabel htmlFor={emailInputId}>Ваш Email</InputLabel> </InputWrapper>
          <InputWrapper variants={itemVariants}> <InputIcon><FiLock /></InputIcon> <InputField id={passwordInputId} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder=" " disabled={loading} /> <InputLabel htmlFor={passwordInputId}>Пароль</InputLabel> </InputWrapper>
          <SubmitButton type="submit" variants={itemVariants} disabled={loading} > <AnimatePresence mode="wait" initial={false}> {loading ? ( <Spinner key="spinner-auth"/> ) : ( <ButtonContent key="content-auth"> {authMode === 'signUp' ? <><FiUserPlus /> Зарегистрироваться</> : <><FiLogIn /> Войти</>} </ButtonContent> )} </AnimatePresence> </SubmitButton>
        </Form>
      )}
      {authMode !== 'resetPassword' && authMode !== 'updatePassword' && (
        <LinksContainer variants={itemVariants}>
          {authMode === 'signIn' ? (
            <> <StyledLink href="#" onClick={(e) => switchToMode(e, 'signUp')}> <FiUserPlus size={16} /> Создать аккаунт </StyledLink> <StyledLink href="#" onClick={(e) => switchToMode(e, 'resetPassword')}> <FiHelpCircle size={16} /> Забыли пароль? </StyledLink> </>
          ) : ( <StyledLink href="#" onClick={(e) => switchToMode(e, 'signIn')}> <FiArrowLeft size={16} /> Уже есть аккаунт? Войти </StyledLink> )}
        </LinksContainer>
      )}
    </StyledAuthCard>
  );
};

// --- Защищенный роут ---
const ProtectedRoute = ({ session, children }) => {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children ? children : <Outlet />;
};

function App() {
  const [session, setSession] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const [authPageInitialMode, setAuthPageInitialMode] = useState('signIn');

  useEffect(() => {
    const handleAuthChange = (_event, currentSession) => {
      console.log("Auth event in App:", _event, "Session:", currentSession);
      setSession(currentSession);

      if (_event === "PASSWORD_RECOVERY" && currentSession) {
        console.log("App: PASSWORD_RECOVERY event, setting authPageInitialMode to updatePassword");
        setAuthPageInitialMode('updatePassword');
        if (window.history.replaceState) {
          const cleanURL = window.location.href.split('#')[0];
          window.history.replaceState(null, null, cleanURL);
        } else {
          window.location.hash = ''; 
        }
      } else if (_event === "SIGNED_OUT") {
        setAuthPageInitialMode('signIn');
      } else if (_event === "USER_UPDATED" && authPageInitialMode === 'updatePassword') {
         console.log("App: USER_UPDATED (after password update), session active. App logic will show HomePage due to session.");
      }
    };
    
    let isRecoveryFlowOnLoad = false;
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
        console.log("App: Recovery hash detected on initial load.");
        isRecoveryFlowOnLoad = true; 
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (!currentSession && !isRecoveryFlowOnLoad) {
          setAuthPageInitialMode('signIn');
      }
      setAppLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handlePasswordHasBeenUpdatedInAuthPage = () => {
    console.log("App: onPasswordUpdated called from AuthPage. Setting authPageInitialMode to signIn.");
    setAuthPageInitialMode('signIn'); 
  };

  if (appLoading) {
    return (
      <AppContainer style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2rem' }}>Загрузка приложения...</h1>
      </AppContainer>
    );
  }

  return (
    <AppContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} >
      <ParticlesBackground />
      <Routes>
        <Route
          path="/auth"
          element={
            !session || authPageInitialMode === 'updatePassword' ? (
              <AuthPageWrapper>
                <AuthPage 
                  onAuthSuccess={handleAuthSuccess}
                  initialAuthMode={authPageInitialMode}
                  onPasswordUpdated={handlePasswordHasBeenUpdatedInAuthPage}
                />
              </AuthPageWrapper>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route element={<ProtectedRoute session={session} />}>
          <Route path="/dashboard" element={<DashboardPage user={session?.user} onLogout={handleLogout} />} />
          <Route path="/board/:boardId" element={<SingleBoardPage />} />
        </Route>
        <Route 
          path="*" 
          element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} 
        />
      </Routes>
    </AppContainer>
  );
}

const handleAuthSuccess = (loggedInUser) => {
  console.log("App: Auth successful (signIn/signUp), user:", loggedInUser);
};

export default App;