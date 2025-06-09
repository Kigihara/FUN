// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiLogIn, FiUserPlus, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiHelpCircle, FiSend } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const AuthFormContainer = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  padding: 40px 35px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const FormTitle = styled(motion.h2)`
  font-family: 'Montserrat', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: #212121;
  margin-bottom: 25px;
`;

const Form = styled(motion.form)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputWrapper = styled(motion.div)`
  position: relative;
  width: 100%;
`;

const InputLabel = styled(motion.label)`
  position: absolute;
  left: 45px;
  top: 15px;
  font-size: 1rem;
  color: #888;
  pointer-events: none;
  transition: all 0.2s ease-out;
  white-space: nowrap;
`;

const InputField = styled(motion.input)`
  width: 100%;
  padding: 20px 15px 8px 45px;
  background-color: #f7f7f7;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  color: #333;
  font-size: 1rem;
  font-weight: 500;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus + ${InputLabel},
  &:not(:placeholder-shown) + ${InputLabel} {
    top: 4px;
    font-size: 0.7rem;
    color: #FAD2E1;
    font-weight: 600;
  }

  &::placeholder {
    color: transparent;
  }

  &:focus {
    border-color: #FAD2E1;
    box-shadow: 0 0 0 3px rgba(250, 210, 225, 0.4);
  }
`;

const InputIcon = styled(motion.span)`
  position: absolute;
  left: 15px;
  top: 15px;
  color: #aaa;
  font-size: 1.1rem;
  pointer-events: none;
  transition: color 0.3s ease;
  
  ${InputWrapper}:focus-within & {
    color: #FAD2E1;
  }
`;

const spinnerAnimation = keyframes`0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }`;
const Spinner = styled(motion.div)`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #424242;
  border-radius: 50%;
  animation: ${spinnerAnimation} 0.8s linear infinite;
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 15px 20px;
  background-color: #FAD2E1;
  color: #424242;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  margin-top: 10px;

  &:hover:not(:disabled) {
    background-color: #E2BCC7;
    color: #fff;
    box-shadow: 0 5px 15px rgba(250, 210, 225, 0.5);
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

const LinksContainer = styled(motion.div)`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 25px;
  font-size: 0.9rem;
`;

const StyledLink = styled(motion.a)`
  color: #5E5C5B;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease;
  cursor: pointer;

  &:hover {
    color: #FAD2E1;
  }
`;

const Message = styled(motion.p)`
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 8px;
  width: 100%;
  
  &.error {
    color: #D32F2F;
    background-color: rgba(211, 47, 47, 0.1);
  }

  &.success {
    color: #2E7D32;
    background-color: rgba(76, 175, 80, 0.1);
  }
`;

function AuthPage({ initialMode, onLogin, onSignup, error, loading, setAuthError, setLoading }) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [localMessage, setLocalMessage] = useState({ text: '', type: 'info' });

  useEffect(() => {
    // Сбрасываем поля и локальное сообщение при смене режима
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setLocalMessage({ text: '', type: 'info' });
    // Также очищаем ошибку из App.jsx, когда меняем режим
    if (error) {
      setAuthError('');
    }
  }, [authMode, setAuthError]);

  const handleAuthAction = (e) => {
    e.preventDefault();
    if (authMode === 'signup') {
      onSignup({ email, password, fullName, phone });
    } else {
      onLogin({ email, password });
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLocalMessage({ text: '', type: 'info' });
    if (!email) {
      setLocalMessage({ text: 'Пожалуйста, введите email', type: 'error' });
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, 
    });
    setLoading(false);

    if (resetError) {
      setLocalMessage({ text: resetError.message, type: 'error' });
    } else {
      setLocalMessage({ text: 'Ссылка для сброса пароля отправлена на ваш email.', type: 'success' });
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  let title = authMode === 'login' ? 'Вход в аккаунт' : authMode === 'signup' ? 'Создание аккаунта' : 'Сброс пароля';
  const displayMessage = error || localMessage.text;
  const messageType = error ? 'error' : localMessage.type;

  return (
    <AuthFormContainer>
      <motion.h2 variants={itemVariants}>{title}</motion.h2>
      
      <AnimatePresence>
        {displayMessage && (
          <Message
            className={messageType}
            key={displayMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {messageType === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
            {displayMessage}
          </Message>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {authMode === 'resetPassword' ? (
          <Form key="reset" onSubmit={handlePasswordReset}>
            <motion.div variants={itemVariants}>
              <InputWrapper>
                <InputIcon><FiMail /></InputIcon>
                <InputField type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder=" " disabled={loading} />
                <InputLabel>Email</InputLabel>
              </InputWrapper>
            </motion.div>
            <motion.div variants={itemVariants}>
              <SubmitButton type="submit" disabled={loading} whileTap={{ scale: 0.98 }}>
                  {loading ? <Spinner/> : 'Отправить ссылку'}
              </SubmitButton>
            </motion.div>
          </Form>
        ) : (
          <Form key="auth" onSubmit={handleAuthAction}>
            <AnimatePresence>
              {authMode === 'signup' && (
                <>
                  <motion.div key="fullNameWrapper" variants={itemVariants} initial="hidden" animate="visible" exit="hidden">
                    <InputWrapper>
                      <InputIcon><FiUserPlus /></InputIcon>
                      <InputField type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder=" " disabled={loading} />
                      <InputLabel>Ваше имя</InputLabel>
                    </InputWrapper>
                  </motion.div>
                  <motion.div key="phoneWrapper" variants={itemVariants} initial="hidden" animate="visible" exit="hidden">
                    <InputWrapper>
                      <InputIcon style={{fontSize: '1rem'}}>📞</InputIcon>
                      <InputField type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder=" " disabled={loading} />
                      <InputLabel>Телефон (необязательно)</InputLabel>
                    </InputWrapper>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            <motion.div variants={itemVariants}>
              <InputWrapper>
                <InputIcon><FiMail /></InputIcon>
                <InputField type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder=" " disabled={loading} />
                <InputLabel>Email</InputLabel>
              </InputWrapper>
            </motion.div>
            <motion.div variants={itemVariants}>
              <InputWrapper>
                <InputIcon><FiLock /></InputIcon>
                <InputField type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder=" " disabled={loading} minLength="6"/>
                <InputLabel>Пароль</InputLabel>
              </InputWrapper>
            </motion.div>
            <motion.div variants={itemVariants}>
              <SubmitButton type="submit" disabled={loading} whileTap={{ scale: 0.98 }}>
                {loading ? <Spinner /> : (authMode === 'signup' ? 'Зарегистрироваться' : 'Войти')}
              </SubmitButton>
            </motion.div>
          </Form>
        )}
      </AnimatePresence>

      <LinksContainer variants={itemVariants}>
        {authMode === 'login' && (
          <>
            <StyledLink href="#" onClick={(e) => {e.preventDefault(); setAuthMode('signup')}}> <FiUserPlus size={16} /> Создать аккаунт </StyledLink>
            <StyledLink href="#" onClick={(e) => {e.preventDefault(); setAuthMode('resetPassword')}}> <FiHelpCircle size={16} /> Забыли пароль? </StyledLink>
          </>
        )}
        {authMode === 'signup' && (
          <StyledLink href="#" onClick={(e) => {e.preventDefault(); setAuthMode('login')}}> <FiArrowLeft size={16} /> Уже есть аккаунт? Войти </StyledLink>
        )}
        {authMode === 'resetPassword' && (
          <StyledLink href="#" onClick={(e) => {e.preventDefault(); setAuthMode('login')}}> <FiArrowLeft size={16} /> Вернуться ко входу </StyledLink>
        )}
      </LinksContainer>
    </AuthFormContainer>
  );
}

export default AuthPage;