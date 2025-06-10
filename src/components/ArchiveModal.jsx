import React, { useMemo, useState, useEffect } from 'react'; // <<< ДОБАВЛЕН useEffect
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Иконки
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const TrashIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

const statusMap = {
  pending: { text: 'Ожидает', className: 'pending' },
  confirmed: { text: 'Подтверждена', className: 'confirmed' },
  cancelled_by_master: { text: 'Отменена', className: 'cancelled' },
  cancelled_by_client: { text: 'Отменена клиентом', className: 'cancelled' },
  completed: { text: 'Завершена', className: 'completed' },
};

function ArchiveModal({ allBookings, onClose, onDeleteRequest }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    const archiveBookings = useMemo(() => {
        return allBookings.filter(b => {
            const isArchived = !['pending', 'confirmed'].includes(b.status);
            if (!isArchived) return false;
            
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
            
            const matchesSearch = searchTerm.trim() === '' ||
                b.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.services?.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate = !dateFilter || b.booking_date === dateFilter;

            return matchesStatus && matchesSearch && matchesDate;
        }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }, [allBookings, searchTerm, statusFilter, dateFilter]);

    return (
        <Modal title="Архив записей" onClose={onClose}>
            <div className="archive-controls">
                <div className="archive-search"> <SearchIcon/> <input type="text" placeholder="Поиск..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /> </div>
                <input type="date" className="archive-date-filter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                <select className="archive-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Все статусы</option>
                    <option value="completed">Завершенные</option>
                    <option value="cancelled_by_master">Отменены мастером</option>
                    <option value="cancelled_by_client">Отменены клиентом</option>
                </select>
            </div>
            <div className="archive-list">
                <AnimatePresence>
                {archiveBookings.length > 0 ? archiveBookings.map((b, index) => (
                    <motion.div 
                        key={`${b.id}-${index}`}
                        layout 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}
                        className={`archive-item status-${statusMap[b.status]?.className || ''}`}
                    >
                        <div className='archive-item-info'>
                            <strong>{new Date(b.booking_date).toLocaleDateString()} в {b.booking_start_time.slice(0,5)}</strong>
                            <span>{b.client_name} - {b.services?.name}</span>
                            {b.notes && <em className='archive-item-notes'>Причина отмены: {b.notes}</em>}
                        </div>
                        <div className="archive-item-actions">
                            <span className='archive-item-status'>{statusMap[b.status]?.text}</span>
                            <button title="Удалить запись навсегда" className="item-btn delete" onClick={() => onDeleteRequest(b.id, 'booking', 'архивную запись')}>
                                <TrashIcon/>
                            </button>
                        </div>
                    </motion.div>
                )) : <p>Записи, соответствующие фильтру, не найдены.</p>}
                </AnimatePresence>
            </div>
        </Modal>
    );
};

// Универсальный модальный компонент
const Modal = ({ children, title, onClose }) => {
    useEffect(() => {
        const handleEsc = (event) => { if (event.keyCode === 27) onClose(); };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEsc);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return ReactDOM.createPortal(
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="modal-content" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button className="modal-close-btn" onClick={onClose}>×</button></div>
                <div className="modal-body">{children}</div>
            </motion.div>
        </motion.div>,
        document.body
    );
};


export default ArchiveModal;