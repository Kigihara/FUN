// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiLogOut, FiPlusSquare, FiClipboard } from 'react-icons/fi';
import { supabase } from '../supabaseClient'; // Путь к клиенту может отличаться, если ты его переместил

// --- Styled Components для DashboardPage ---
const DashboardContainer = styled(motion.div)`
  width: 100%;
  min-height: 100vh; // Чтобы занимал всю высоту, если контента мало
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  position: relative; // Для позиционирования других элементов, если нужно
  z-index: 1; // Чтобы был над фоном (ParticlesBackground)
`;

const Header = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const UserInfo = styled.div`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  span {
    font-weight: bold;
    color: #f06388; // Акцентный цвет
  }
`;

const LogoutButtonStyled = styled(motion.button)`
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
`;

const BoardsGrid = styled(motion.div)`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const BoardCardStyled = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);

  &:hover {
    transform: translateY(-5px) scale(1.02);
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }

  h3 {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: #fff;
  }
  p {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.5;
  }
`;

const CreateBoardButton = styled(motion.button)`
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(90deg, #e73c7e 0%, #f06388 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  box-shadow: 0 5px 15px rgba(231, 60, 126, 0.2);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(231, 60, 126, 0.3);
  }
`;

// --- КОНЕЦ Styled Components для DashboardPage ---

const DashboardPage = ({ user, onLogout }) => {
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [errorBoards, setErrorBoards] = useState('');
  const [newBoardName, setNewBoardName] = useState(''); // Для формы создания доски

  useEffect(() => {
    const fetchBoards = async () => {
      if (!user) return; // Не загружаем доски, если нет пользователя

      setLoadingBoards(true);
      setErrorBoards('');
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('*')
          .eq('user_id', user.id) // Выбираем только доски текущего пользователя
          .order('created_at', { ascending: false }); // Сортируем по дате создания

        if (error) {
          throw error;
        }
        setBoards(data || []);
      } catch (error) {
        console.error("Ошибка загрузки досок:", error);
        setErrorBoards('Не удалось загрузить доски.');
      } finally {
        setLoadingBoards(false);
      }
    };

    fetchBoards();
  }, [user]); // Перезагружаем доски, если изменился пользователь

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) {
      setErrorBoards('Название доски не может быть пустым.');
      return;
    }
    if (!user) {
      setErrorBoards('Пользователь не аутентифицирован.');
      return;
    }

    setLoadingBoards(true); // Можно использовать отдельный loading для создания
    setErrorBoards('');
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([{ name: newBoardName, user_id: user.id }])
        .select(); // select() возвращает созданную запись

      if (error) {
        throw error;
      }
      if (data && data.length > 0) {
        setBoards([data[0], ...boards]); // Добавляем новую доску в начало списка
        setNewBoardName(''); // Очищаем поле ввода
      }
    } catch (error) {
      console.error("Ошибка создания доски:", error);
      setErrorBoards('Не удалось создать доску.');
    } finally {
      setLoadingBoards(false);
    }
  };

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }} // Небольшая задержка для эффекта
    >
      <Header>
        <UserInfo>
          Вы вошли как: <span>{user.email}</span>
        </UserInfo>
        <LogoutButtonStyled onClick={onLogout}>
          <FiLogOut /> Выйти
        </LogoutButtonStyled>
      </Header>

      <h1 style={{ fontSize: '2.8rem', marginBottom: '30px', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>Ваши доски</h1>
      
      {/* Форма для создания новой доски (очень простая) */}
      <form onSubmit={handleCreateBoard} style={{ marginBottom: '30px', display: 'flex', gap: '10px', width: '100%', maxWidth: '500px' }}>
        <input 
          type="text" 
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder="Название новой доски"
          style={{ flexGrow: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white' }}
          disabled={loadingBoards}
        />
        <CreateBoardButton type="submit" disabled={loadingBoards}>
          <FiPlusSquare /> Создать
        </CreateBoardButton>
      </form>
      {errorBoards && <p style={{ color: '#ff6b6b', marginBottom: '20px' }}>{errorBoards}</p>}

      {loadingBoards && <p>Загрузка досок...</p>}
      
      {!loadingBoards && boards.length === 0 && !errorBoards && (
        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)' }}>У вас пока нет досок. Создайте первую!</p>
      )}

      {!loadingBoards && boards.length > 0 && (
        <BoardsGrid
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {boards.map((board) => (
            // Пока простой вывод, потом заменим на BoardCard.jsx
            <BoardCardStyled 
              key={board.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              onClick={() => alert(`Переход на доску: ${board.name}`)} // Заглушка
            >
              <h3>{board.name}</h3>
              {board.description && <p>{board.description}</p>}
              <p style={{fontSize: '0.8rem', opacity: 0.5, marginTop: '15px'}}>Создана: {new Date(board.created_at).toLocaleDateString()}</p>
            </BoardCardStyled>
          ))}
        </BoardsGrid>
      )}
    </DashboardContainer>
  );
};

export default DashboardPage;