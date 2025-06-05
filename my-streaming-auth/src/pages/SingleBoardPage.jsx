// src/pages/SingleBoardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiArrowLeft, FiPlusSquare, FiX, FiCheck } from 'react-icons/fi'; // Убрали FiLoader, т.к. Spinner свой

// --- Styled Components ---
const PageContainer = styled(motion.div)`
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 1; 
`;

const PageHeader = styled.div`
  width: 100%;
  max-width: 1400px; 
  margin: 0 auto 30px auto; 
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackLink = styled(RouterLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255,255,255,0.1);
    color: #fff;
  }
`;
   
const BoardTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  text-align: center;
  flex-grow: 1; 
  margin: 0 20px; 
`;

const ColumnsContainer = styled(motion.div)`
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 1400px; 
  margin: 0 auto; 
  overflow-x: auto; 
  padding-bottom: 20px; 
  padding-top: 10px;

  &::-webkit-scrollbar { height: 10px; }
  &::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 5px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
`;

const ColumnStyled = styled(motion.div)`
  background-color: rgba(0,0,0, 0.2); 
  min-width: 300px; 
  max-width: 320px;
  padding: 15px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  height: fit-content;
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 5px;
`;

const ColumnName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
`;

const spinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
const Spinner = styled(motion.div)`
  width: 16px; /* Для ActionButton */
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spinnerAnimation} 0.8s linear infinite;
`;

const AddColumnFormWrapper = styled(motion.div)`
  min-width: 280px;
  background-color: rgba(0,0,0, 0.15);
  padding: 15px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 10px; 
  flex-shrink: 0;
  height: fit-content;
`;

const AddColumnInput = styled.input`
  width: 100%;
  padding: 10px 12px;
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

const AddColumnActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled(motion.button)`
  padding: 8px 15px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.2s ease, opacity 0.2s ease;
  min-width: 90px; // Чтобы кнопки были одинаковой ширины

  &.primary {
    background-color: #52c41a; 
    color: white;
    &:hover:not(:disabled) {
      background-color: #49b115;
    }
  }
  &.secondary {
    background-color: rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.8);
    &:hover:not(:disabled) {
      background-color: rgba(255,255,255,0.25);
      color: white;
    }
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const AddColumnToggle = styled(motion.button)`
  min-width: 280px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: rgba(255,255,255,0.7);
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  margin-left: 10px; 
  flex-shrink: 0; 
  height: 60px; // Чтобы совпадала с высотой формы

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    color: #fff;
  }
`;
// --- Конец Styled Components ---

const SingleBoardPage = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null); // Используется
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true); // Используется
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [error, setError] = useState('');
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const fetchBoardData = useCallback(async () => {
    if (!boardId) {
      setLoading(false); // Важно сбросить загрузку, если нет boardId
      return;
    }
    setLoading(true); // Устанавливаем загрузку В НАЧАЛЕ
    setError('');
    try {
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id, name, description')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;
      if (!boardData) throw new Error('Доска не найдена.');
      setBoard(boardData); // Устанавливаем данные доски

      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });
      
      if (columnsError) throw columnsError;
      setColumns(columnsData || []);

    } catch (err) {
      console.error("Ошибка загрузки данных для доски:", err);
      setError(err.message || 'Не удалось загрузить данные.');
    } finally {
      setLoading(false); // Сбрасываем загрузку В КОНЦЕ
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleAddColumnSubmit = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) {
      alert("Название колонки не может быть пустым.");
      return;
    }
    if (!boardId || !board) {
      setError("Доска не загружена, невозможно добавить колонку.");
      return;
    }
    setIsCreatingColumn(true);
    setError(''); 
    try {
      const newPosition = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0;
      const { data, error: insertError } = await supabase
        .from('columns')
        .insert([{ 
          name: newColumnName.trim(), 
          board_id: boardId,
          position: newPosition 
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setColumns(prevColumns => [...prevColumns, data].sort((a,b) => a.position - b.position));
        setNewColumnName(''); 
        setShowAddColumnForm(false); 
      }
    } catch (err) {
      console.error("Ошибка создания колонки:", err);
      setError(err.message || 'Не удалось создать колонку.');
    } finally {
      setIsCreatingColumn(false);
    }
  };

  // Убираем handleAddColumn, так как форма теперь отправляется через handleAddColumnSubmit
  // const handleAddColumn = async () => { /* ... */ };


  if (loading) return <PageContainer><p style={{fontSize: '1.2rem', textAlign: 'center', width: '100%'}}>Загрузка...</p></PageContainer>;
  if (error) return <PageContainer><p style={{color: '#ff6b6b', fontSize: '1.2rem', textAlign: 'center', width: '100%'}}>{error}</p> <BackLink to="/dashboard" style={{margin: '20px auto 0'}}><FiArrowLeft /> Назад к доскам</BackLink></PageContainer>;
  // Условие !board здесь уже не нужно, так как если board null, а loading false, то это будет ошибка "Доска не найдена" от fetchBoardData
  if (!board && !loading) return <PageContainer><p style={{fontSize: '1.2rem', textAlign: 'center', width: '100%'}}>Доска не найдена.</p><BackLink to="/dashboard" style={{margin: '20px auto 0'}}><FiArrowLeft /> Назад к доскам</BackLink></PageContainer>;


  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <PageHeader>
        <BackLink to="/dashboard">
            <FiArrowLeft size={20} /> Назад к доскам
        </BackLink>
        <BoardTitle>{board?.name || 'Загрузка названия...'}</BoardTitle> {/* Используем board?.name */}
        <div style={{width: '120px', flexShrink: 0}}></div> 
      </PageHeader>
      
      {board?.description && 
        <p style={{width: '100%', maxWidth: '1400px', margin: '0 auto 20px auto', color: 'rgba(255,255,255,0.8)', textAlign: 'left'}}>
          {board.description}
        </p>
      }
      {/* Сообщение об ошибке при создании колонки (если setError используется для этого) */}
      {/* error уже обрабатывается выше, это можно убрать или сделать специфичным для формы */}
      {/* {error && <p style={{color: '#ff6b6b', marginBottom: '15px', width: '100%', maxWidth: '1400px', margin: '0 auto 15px auto', textAlign: 'left'  }}>{error}</p>} */}
      
      <ColumnsContainer>
        <AnimatePresence>
          {columns.map(column => (
            <ColumnStyled 
              key={column.id}
              layout
              initial={{ opacity: 0, scale: 0.8, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            >
              <ColumnHeader>
                <ColumnName>{column.name}</ColumnName>
              </ColumnHeader>
              <div style={{ minHeight: '50px', color: 'rgba(255,255,255,0.5)'}}>(Задачи здесь)</div>
            </ColumnStyled>
          ))}
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          {showAddColumnForm ? (
            <AddColumnFormWrapper
              key="add-column-form"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 280 }}
              exit={{ opacity: 0, width: 0, transition: {duration: 0.2} }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            >
              <form onSubmit={handleAddColumnSubmit} style={{width: '100%'}}>
                <AddColumnInput
                  type="text"
                  placeholder="Название колонки"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  autoFocus
                  disabled={isCreatingColumn}
                />
                <AddColumnActions>
                  <ActionButton 
                    type="submit" 
                    className="primary" 
                    disabled={isCreatingColumn || !newColumnName.trim()}
                    whileTap={{scale: 0.95}}
                  >
                    {isCreatingColumn ? <Spinner /> : <FiCheck />}
                    {isCreatingColumn ? '' : 'Добавить'}
                  </ActionButton>
                  <ActionButton 
                    type="button" 
                    className="secondary" 
                    onClick={() => { setShowAddColumnForm(false); setNewColumnName(''); setError(''); }} // Сбрасываем ошибку формы
                    disabled={isCreatingColumn}
                    whileTap={{scale: 0.95}}
                  >
                    <FiX />
                  </ActionButton>
                </AddColumnActions>
              </form>
            </AddColumnFormWrapper>
          ) : (
            <AddColumnToggle
              key="add-column-button"
              onClick={() => {setShowAddColumnForm(true); setError('');}} // Сбрасываем ошибку при открытии формы
              whileTap={{scale: 0.97}}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FiPlusSquare /> Добавить колонку 
            </AddColumnToggle>
          )}
        </AnimatePresence>
      </ColumnsContainer>
    </PageContainer>
  );
};

export default SingleBoardPage;