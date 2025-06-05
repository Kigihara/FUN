// src/components/BoardCard.jsx
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMoreVertical } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom'; // Убедимся, что Link импортирован

const CardLinkWrapper = styled(RouterLink)`
  text-decoration: none;
  color: inherit;
  display: block; /* Важно для корректной работы hover и layout */
  border-radius: 16px; /* Добавляем радиус сюда, чтобы вся область была кликабельна */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover { /* Применяем hover-эффект на саму ссылку-обертку */
    transform: translateY(-6px) scale(1.03);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  
  &:focus-visible { // Стили для фокуса (доступность)
    outline: 2px solid #f06388; // Акцентный цвет
    outline-offset: 2px;
  }
`;

const CardWrapperInner = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px; // Радиус теперь на CardLinkWrapper, но можно и здесь для внутреннего вида
  padding: 25px;
  /* cursor: pointer; // Убираем, так как теперь это ссылка */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;
  height: 100%; // Чтобы занимал всю высоту LinkWrapper
  box-shadow: 0 5px 15px rgba(0,0,0,0.1); // Начальная тень

  /* Стили hover теперь применяются к CardLinkWrapper, 
     но можно добавить внутренние изменения фона при hover на CardLinkWrapper, если нужно */
  ${CardLinkWrapper}:hover & {
    background: rgba(255, 255, 255, 0.13);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  width: 100%; // Чтобы занимал всю ширину
`;

const BoardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin-right: 10px; // Отступ от кнопки меню
  word-break: break-word; // Перенос длинных названий
`;

const BoardDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255,255,255,0.75);
  line-height: 1.6;
  margin-bottom: 15px;
  flex-grow: 1;
  width: 100%;
  word-break: break-word;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  width: 100%;
`;

const CreatedDate = styled.p`
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
`;

const ActionMenuButton = styled(motion.button)`
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
  flex-shrink: 0; // Чтобы кнопка не сжималась
  z-index: 5; // Чтобы была поверх CardLinkWrapper для клика

  &:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
`;

// eslint-disable-next-line no-unused-vars
const BoardCard = ({ board, onDelete, onEdit }) => { 
  const itemVariants = { 
    hidden: { opacity: 0, y: 30, scale: 0.95 }, 
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping:15 } } 
  };

  const handleMenuClick = (e) => {
    e.preventDefault(); // Предотвращаем переход по ссылке CardLinkWrapper
    e.stopPropagation(); // Останавливаем всплытие, чтобы не сработал onClick на CardLinkWrapper
    alert('Меню действий (в разработке)'); 
    // Здесь в будущем будет логика открытия выпадающего меню с опциями Edit/Delete
    // if (onEdit) onEdit(board.id);
    // if (onDelete) onDelete(board.id);
  };

  return (
    <CardLinkWrapper 
      to={`/board/${board.id}`}
      // onClick={() => console.log("Navigating to board:", board.id)} // Для отладки, если нужно
    > 
      <CardWrapperInner // Переименовал, чтобы не было конфликта имен
        variants={itemVariants}
        // layout проп здесь может быть не нужен, если CardLinkWrapper его не поддерживает напрямую
        // или если анимация grid управляется из DashboardPage
      >
        <div>
          <CardHeader>
            <BoardTitle>{board.name}</BoardTitle>
            <ActionMenuButton 
               onClick={handleMenuClick} // Используем отдельный обработчик
               whileTap={{ scale: 0.9 }}
               title="Действия с доской" // Для доступности
            >
              <FiMoreVertical size={20}/>
            </ActionMenuButton>
          </CardHeader>
          {board.description && <BoardDescription>{board.description}</BoardDescription>}
        </div>
        <CardFooter>
          <CreatedDate>
            Создана: {new Date(board.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </CreatedDate>
        </CardFooter>
      </CardWrapperInner>
    </CardLinkWrapper>
  );
};

export default BoardCard;