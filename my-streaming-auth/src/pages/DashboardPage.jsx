// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components'; // Добавили keyframes
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiPlusSquare } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import BoardCard from '../components/BoardCard';

// --- Styled Components для DashboardPage ---
const DashboardContainer = styled(motion.div)`
  width: 100%;
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  position: relative;
  z-index: 1;
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
    color: #f06388; 
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

// --- ДОБАВЛЯЕМ КОМПОНЕНТ Spinner ЗДЕСЬ ---
const spinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled(motion.div)`
  width: 18px; /* Подгоняем под размер в кнопке */
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spinnerAnimation} 0.8s linear infinite;
`;
// --- КОНЕЦ КОМПОНЕНТА Spinner ---

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
  justify-content: center; // Для центрирования спиннера
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  box-shadow: 0 5px 15px rgba(231, 60, 126, 0.2);
  min-height: 45px; // Чтобы высота не прыгала при смене контента на спиннер

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(231, 60, 126, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FormCreateBoard = styled.form`
  margin-bottom: 30px;
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 500px;
  align-items: center;
`;

const InputNewBoard = styled.input`
  flex-grow: 1;
  padding: 12px 15px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;

  &::placeholder {
    color: rgba(255,255,255,0.5);
  }

  &:focus {
    outline: none;
    border-color: rgba(255,255,255,0.4);
    background: rgba(255,255,255,0.15);
  }
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  margin: 20px 0;
`;

const NoBoardsText = styled.p`
  font-size: 1.2rem;
  color: rgba(255,255,255,0.7);
  margin-top: 20px;
`;


const DashboardPage = ({ user, onLogout }) => {
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [errorBoards, setErrorBoards] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      if (!user) {
        setLoadingBoards(false);
        return;
      }
      setLoadingBoards(true);
      setErrorBoards('');
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBoards(data || []);
      } catch (error) {
        console.error("Ошибка загрузки досок:", error);
        setErrorBoards('Не удалось загрузить доски.');
      } finally {
        setLoadingBoards(false);
      }
    };
    fetchBoards();
  }, [user]);

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
    setIsCreatingBoard(true);
    setErrorBoards('');
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([{ name: newBoardName, user_id: user.id }])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setBoards([data[0], ...boards]);
        setNewBoardName('');
      }
    } catch (error) {
      console.error("Ошибка создания доски:", error);
      setErrorBoards('Не удалось создать доску. ' + (error.message || ''));
    } finally {
      setIsCreatingBoard(false);
    }
  };

  // УДАЛЯЕМ handleBoardClick, так как навигация теперь через Link в BoardCard
  // const handleBoardClick = (boardId, boardName) => {
  //   alert(`Переход на доску: ${boardName} (ID: ${boardId}) - в разработке`);
  // };

  const handleDeleteBoard = async (boardId, event) => {
    event.stopPropagation();
    if (window.confirm("Вы уверены, что хотите удалить эту доску? Это действие необратимо.")) {
        try {
            const { error } = await supabase
                .from('boards')
                .delete()
                .match({ id: boardId, user_id: user.id }); 
            if (error) throw error;
            setBoards(boards.filter(board => board.id !== boardId));
        } catch (error) {
            console.error("Ошибка удаления доски:", error);
            alert("Не удалось удалить доску.");
        }
    }
  };

  const handleEditBoard = (boardId, event) => {
    event.stopPropagation();
    alert(`Редактирование доски ID: ${boardId} - в разработке`);
  };

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Header>
        <UserInfo>
          Вы вошли как: <span>{user.email}</span>
        </UserInfo>
        <LogoutButtonStyled onClick={onLogout} whileTap={{ scale: 0.95 }}>
          <FiLogOut /> Выйти
        </LogoutButtonStyled>
      </Header>

      <h1 style={{ fontSize: '2.8rem', marginBottom: '30px', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>Ваши доски</h1>
      
      <FormCreateBoard onSubmit={handleCreateBoard}>
        <InputNewBoard 
          type="text" 
          value={newBoardName}
          onChange={(e) => { setNewBoardName(e.target.value); setErrorBoards(''); }}
          placeholder="Название новой доски"
          disabled={isCreatingBoard}
        />
        <CreateBoardButton type="submit" disabled={isCreatingBoard} whileTap={{ scale: 0.95 }}>
          <AnimatePresence mode="wait" initial={false}>
            {isCreatingBoard ? (
              <Spinner 
                key="spinner-create-board"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <motion.span // Обертка для текста и иконки для анимации
                key="content-create-board"
                style={{display: 'flex', alignItems: 'center', gap: '10px'}}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiPlusSquare /> Создать
              </motion.span>
            )}
          </AnimatePresence>
        </CreateBoardButton>
      </FormCreateBoard>
      
      {errorBoards && !loadingBoards && <p style={{ color: '#ff6b6b', marginBottom: '20px', textAlign: 'center' }}>{errorBoards}</p>}

      {loadingBoards && <LoadingText>Загрузка досок...</LoadingText>}
      
      {!loadingBoards && boards.length === 0 && !errorBoards && (
        <NoBoardsText>У вас пока нет досок. Создайте первую!</NoBoardsText>
      )}

      {!loadingBoards && boards.length > 0 && (
        <BoardsGrid
          as={motion.div} 
          variants={{
            show: { transition: { staggerChildren: 0.07 } }
          }}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {boards.map((board) => (
              <BoardCard 
                key={board.id}
                board={board}
                // onClick пропс удален, навигация внутри BoardCard
                onDelete={(e) => handleDeleteBoard(board.id, e)} 
                onEdit={(e) => handleEditBoard(board.id, e)}    
              />
            ))}
          </AnimatePresence>
        </BoardsGrid>
      )}
    </DashboardContainer>
  );
};

export default DashboardPage;