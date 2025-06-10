import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import Calendar from 'react-calendar';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import 'react-calendar/dist/Calendar.css';
import './MasterScheduleManager.css';

// Иконки
const TrashIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const ArchiveIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>);
const CoffeeIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const CancelIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);


const statusMap = {
  pending: { text: 'Ожидает', className: 'pending' },
  confirmed: { text: 'Подтверждена', className: 'confirmed' },
  cancelled_by_master: { text: 'Отменена', className: 'cancelled' },
  cancelled_by_client: { text: 'Отменена клиентом', className: 'cancelled' },
  completed: { text: 'Завершена', className: 'completed' },
};

const toYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function MasterScheduleManager() {
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    const [actionToConfirm, setActionToConfirm] = useState(null);
    const [confirmPayload, setConfirmPayload] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [availRes, bookRes] = await Promise.all([
                supabase.from('availability').select('*'),
                supabase.from('bookings').select('*, services(*)')
            ]);
            if (availRes.error) throw availRes.error;
            if (bookRes.error) throw bookRes.error;
            setAvailability(availRes.data || []);
            setBookings(bookRes.data || []);
        } catch (error) { toast.error("Ошибка загрузки данных: " + error.message);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getDailyScheduleForDate = (date) => {
        const dateString = toYYYYMMDD(date);
        const dayBookings = bookings.filter(b => b.booking_date === dateString && (b.status === 'pending' || b.status === 'confirmed')).map(b => ({ ...b, type: 'booking' }));
        const dayAvailability = availability.filter(a => a.date === dateString).map(a => ({ ...a, type: 'availability' }));
        const combined = [...dayBookings, ...dayAvailability];
        return combined.sort((a, b) => {
            const timeA = a.type === 'booking' ? a.booking_start_time : a.start_time;
            const timeB = b.type === 'booking' ? b.booking_start_time : b.start_time;
            return timeA.localeCompare(timeB);
        });
    };

    const checkOverlap = (newStartStr, newEndStr, scheduleForCheck) => {
        const timeToMinutes = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; };
        const newStart = timeToMinutes(newStartStr); const newEnd = timeToMinutes(newEndStr);
        for (const item of scheduleForCheck) {
            const existingStart = timeToMinutes(item.type === 'booking' ? item.booking_start_time : item.start_time);
            const existingEnd = timeToMinutes(item.type === 'booking' ? item.booking_end_time : item.end_time);
            if (newStart < existingEnd && newEnd > existingStart) return true;
        }
        return false;
    };

    const handleAddSlot = async (startTime, endTime, isBreak = false) => {
        setIsSubmitting(true);
        const currentSchedule = getDailyScheduleForDate(selectedDate);
        if (checkOverlap(startTime, endTime, currentSchedule)) {
            toast.error("Новый слот пересекается с существующей записью или слотом!");
            setIsSubmitting(false); return;
        }
        const dateString = toYYYYMMDD(selectedDate);
        try {
            const { error } = await supabase.from('availability').insert([{ date: dateString, start_time: `${startTime}:00`, end_time: `${endTime}:00`, is_booked: isBreak }]);
            if (error) throw error;
            toast.success(isBreak ? "Перерыв добавлен!" : "Слот добавлен!");
            await fetchData();
        } catch (error) { toast.error("Ошибка добавления: " + error.message);
        } finally { setIsSubmitting(false); }
    };
    
    const handleDeleteRequest = (id, type, name) => {
        const action = async () => {
            setIsSubmitting(true);
            const table = type === 'slot' ? 'availability' : 'bookings';
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) { toast.error("Ошибка удаления: " + error.message);
            } else {
                toast.success("Запись успешно удалена!");
                await fetchData();
            }
            setIsSubmitting(false);
            setShowConfirmModal(false);
        };
        setConfirmPayload({ title: `Удалить ${name}?`, body: 'Это действие нельзя будет отменить.' });
        setActionToConfirm(() => action);
        setShowConfirmModal(true);
    };

    const handleBookingStatusUpdate = async (bookingId, newStatus, reason = '') => {
        setIsSubmitting(true);
        const updatePayload = { status: newStatus, notes: reason || null };
        try {
            const { error } = await supabase.from('bookings').update(updatePayload).eq('id', bookingId);
            if (error) throw error;
            toast.success("Статус записи обновлен!");
            await fetchData();
            if (showCancellationModal) {
                setShowCancellationModal(false);
            }
        } catch (error) { toast.error("Ошибка обновления: " + error.message);
        } finally { setIsSubmitting(false); }
    };
    
    const allConfirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null;
        const dateString = toYYYYMMDD(date);
        const hasConfirmed = allConfirmedBookings.some(b => b.booking_date === dateString);
        const hasPending = bookings.some(b => b.booking_date === dateString && b.status === 'pending');
        const hasSlot = availability.some(a => a.date === dateString);
        const classes = [];
        if (hasConfirmed) classes.push('has-confirmed-booking');
        if (hasPending && !hasConfirmed) classes.push('has-pending-booking');
        if (hasSlot) classes.push('has-slot');
        return classes.join(' ');
    };
    const dailySchedule = getDailyScheduleForDate(selectedDate);
    
    return (
        <>
            <div className="master-dashboard">
                <motion.div className="dashboard-calendar-panel" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                    <Calendar onChange={setSelectedDate} value={selectedDate} minDate={new Date()} tileClassName={tileClassName} prev2Label={null} next2Label={null} />
                    <button className="archive-button" onClick={() => setShowArchiveModal(true)}> <ArchiveIcon /> <span>Архив записей</span> </button>
                </motion.div>

                <motion.div className="dashboard-schedule-panel" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="schedule-panel-header">
                        <h3>Расписание на</h3>
                        <h2>{selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                    </div>
                    
                    <div className="schedule-items-list">
                        <AnimatePresence>
                            {loading && <p>Загрузка...</p>}
                            {!loading && dailySchedule.length === 0 && (
                                <motion.div className="empty-day-message" initial={{opacity:0}} animate={{opacity:1}}>
                                    <p>На этот день нет записей или слотов.</p>
                                </motion.div>
                            )}
                            {!loading && dailySchedule.map((item, index) => (
                                <ScheduleItem 
                                    key={`${item.id}-${index}`}
                                    item={item} 
                                    onStatusUpdate={handleBookingStatusUpdate} 
                                    onCancelClick={() => {
                                        setBookingToCancel(item.id);
                                        setShowCancellationModal(true);
                                    }}
                                    onDeleteRequest={handleDeleteRequest}
                                    isSubmitting={isSubmitting}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    <AddSlotForm onAddSlot={handleAddSlot} isSubmitting={isSubmitting} dailySchedule={dailySchedule} />
                </motion.div>
            </div>
            
            <AnimatePresence>
                {showArchiveModal && (
                    <ArchiveModal 
                        bookings={bookings} 
                        onClose={() => setShowArchiveModal(false)} 
                        onDeleteRequest={handleDeleteRequest}
                    />
                )}
                {showCancellationModal && (
                     <Modal title="Причина отмены записи" onClose={() => setShowCancellationModal(false)}>
                        <div className="cancellation-form">
                            <textarea placeholder="Например: Клиент попросил перенести..." value={cancellationReason} onChange={e => setCancellationReason(e.target.value)} rows={4}/>
                            <button className="confirm-cancellation-btn" disabled={isSubmitting || !cancellationReason.trim()} onClick={() => handleBookingStatusUpdate(bookingToCancel, 'cancelled_by_master', cancellationReason)}>Отменить запись</button>
                        </div>
                    </Modal>
                )}
                <ConfirmModal 
                    isOpen={showConfirmModal}
                    title={confirmPayload?.title || 'Подтвердите действие'}
                    onCancel={() => setShowConfirmModal(false)}
                    onConfirm={actionToConfirm}
                    confirmText="Удалить"
                >
                    <p>{confirmPayload?.body || 'Вы уверены, что хотите продолжить?'}</p>
                </ConfirmModal>
            </AnimatePresence>
        </>
    );
}

// --- ДОЧЕРНИЕ КОМПОНЕНТЫ ---

const ScheduleItem = ({ item, onStatusUpdate, onCancelClick, onDeleteRequest, isSubmitting }) => {
    const isBooking = item.type === 'booking';
    const isBreak = item.type === 'availability' && item.is_booked;

    let itemClass = 'schedule-item';
    let timeDisplay, title, subtitle, statusInfo;

    if (isBooking) {
        statusInfo = statusMap[item.status];
        itemClass += ` booking-item status-${statusInfo.className}`;
        timeDisplay = `${item.booking_start_time.slice(0, 5)} - ${item.booking_end_time.slice(0, 5)}`;
        title = item.services?.name || 'Услуга';
        subtitle = `${item.client_name} - ${item.client_phone}`;
    } else {
        itemClass += ` availability-item ${isBreak ? 'break-item' : ''}`;
        timeDisplay = `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`;
        title = isBreak ? 'Перерыв' : 'Свободный интервал';
        subtitle = null;
    }

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, transition: {duration: 0.2} }} className={itemClass}>
            <div className="item-main-content">
                <span className="item-time">{timeDisplay}</span>
                <div className="item-details">
                    <p className="item-title">{isBreak && <CoffeeIcon />} {title}</p>
                    {subtitle && <p className="item-subtitle">{subtitle}</p>}
                </div>
                <div className="item-actions">
                    {isBooking && item.status === 'pending' && ( <>
                        <button title="Подтвердить" className="item-btn confirm" onClick={() => onStatusUpdate(item.id, 'confirmed')} disabled={isSubmitting}><CheckIcon/></button>
                        <button title="Отклонить" className="item-btn cancel" onClick={() => onDeleteRequest(item.id, 'booking', 'заявку')} disabled={isSubmitting}><CancelIcon/></button>
                    </> )}
                    {isBooking && item.status === 'confirmed' && (
                        <>
                            <button title="Отметить выполненной" className="item-btn complete" onClick={() => onStatusUpdate(item.id, 'completed')} disabled={isSubmitting}><CheckIcon/></button>
                            <button title="Отменить запись" className="item-btn cancel" onClick={onCancelClick} disabled={isSubmitting}><CancelIcon/></button>
                        </>
                    )}
                    {!isBooking && ( <button title="Удалить" className="item-btn delete" onClick={() => onDeleteRequest(item.id, 'slot', 'слот')} disabled={isSubmitting}><TrashIcon /></button> )}
                </div>
            </div>
        </motion.div>
    );
};

const AddSlotForm = ({ onAddSlot, isSubmitting, dailySchedule }) => {
    const [startTime, setStartTime] = useState('09:00');

    useEffect(() => {
        if (dailySchedule.length > 0) {
            const lastItem = dailySchedule[dailySchedule.length - 1];
            const lastEndTime = (lastItem.type === 'booking' ? lastItem.booking_end_time : lastItem.end_time) || '09:00';
            setStartTime(lastEndTime.slice(0, 5));
        } else {
            setStartTime('09:00');
        }
    }, [dailySchedule]);

    const addDuration = (time, durationMinutes) => {
        const [h, m] = time.split(':').map(Number);
        const totalMinutes = h * 60 + m + durationMinutes;
        const newH = Math.floor(totalMinutes / 60);
        const newM = totalMinutes % 60;
        
        if (newH >= 24) return null;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const handleSubmit = (durationMinutes, isBreak = false) => {
        const endTime = addDuration(startTime, durationMinutes);
        if (!endTime) {
            toast.error("Ошибка: время окончания слота не может быть на следующий день.");
            return;
        }
        if (startTime >= endTime) { 
            toast.error("Ошибка длительности"); 
            return; 
        }
        onAddSlot(startTime, endTime, isBreak);
    };

    return (
        <form className="add-slot-form-v2" onSubmit={(e) => e.preventDefault()}>
            <div className="form-v2-inputs"> <label>Начало:</label> <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} step="900" required/> </div>
            <div className="form-v2-presets"> <label>Добавить слот:</label>
                <button type="button" onClick={() => handleSubmit(120)} disabled={isSubmitting}>2 ч</button>
                <button type="button" onClick={() => handleSubmit(180)} disabled={isSubmitting}>3 ч</button>
            </div>
            <div className="form-v2-presets break-presets"> <label>Добавить перерыв:</label>
                <button type="button" onClick={() => handleSubmit(30, true)} disabled={isSubmitting}>30 м</button>
                <button type="button" onClick={() => handleSubmit(60, true)} disabled={isSubmitting}>1 ч</button>
            </div>
        </form>
    );
};

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

const ArchiveModal = ({ bookings, onClose, onDeleteRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    const archiveBookings = useMemo(() => {
        return bookings.filter(b => {
            const isArchived = !['pending', 'confirmed'].includes(b.status);
            if (!isArchived) return false;
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
            const matchesSearch = searchTerm.trim() === '' ||
                b.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.services?.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate = !dateFilter || b.booking_date === dateFilter;
            return matchesStatus && matchesSearch && matchesDate;
        }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }, [bookings, searchTerm, statusFilter, dateFilter]);

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

export default MasterScheduleManager;