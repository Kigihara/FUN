import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import Calendar from 'react-calendar';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import 'react-calendar/dist/Calendar.css';
import './MasterScheduleManager.css';

// --- ИКОНКИ ---
const TrashIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const MoreHorizontalIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>);
const ArchiveIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>);
const CoffeeIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>);

const statusMap = {
  pending: { text: 'Ожидает', className: 'pending' },
  confirmed: { text: 'Подтверждена', className: 'confirmed' },
  cancelled_by_master: { text: 'Отменена', className: 'cancelled' },
  cancelled_by_client: { text: 'Отменена клиентом', className: 'cancelled' },
  completed: { text: 'Завершена', className: 'completed' },
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
function MasterScheduleManager() {
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [showArchive, setShowArchive] = useState(false);
    const [cancellationModal, setCancellationModal] = useState({ isOpen: false, bookingId: null });
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

    // <<< ИСПРАВЛЕНИЕ: Новая, правильная функция проверки пересечений >>>
    const checkOverlap = (newStart, newEnd) => {
        const scheduleForDay = dailySchedule.map(item => {
            if (item.type === 'booking') return { start: item.booking_start_time, end: item.booking_end_time };
            return { start: item.start_time, end: item.end_time };
        });

        for (const item of scheduleForDay) {
            // Если новый слот начинается строго раньше, чем заканчивается существующий,
            // И новый слот заканчивается строго позже, чем начинается существующий,
            // то это пересечение.
            if (newStart < item.end && newEnd > item.start) {
                return true;
            }
        }
        return false;
    };

    const handleAddSlot = async (startTime, endTime, isBreak = false) => {
        setIsSubmitting(true);
        if (checkOverlap(startTime, endTime)) {
            toast.error("Новый слот пересекается с существующей записью или слотом!");
            setIsSubmitting(false);
            return;
        }

        const dateString = selectedDate.toISOString().split('T')[0];
        try {
            const { data, error } = await supabase.from('availability').insert([{ date: dateString, start_time: startTime, end_time: endTime, is_booked: isBreak }]).select().single();
            if (error) throw error;
            toast.success(isBreak ? "Перерыв добавлен!" : "Слот добавлен!");
            setAvailability(prev => [...prev, data]);
        } catch (error) { toast.error("Ошибка добавления: " + error.message);
        } finally { setIsSubmitting(false); }
    };
    
    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Удалить этот слот/перерыв?")) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('availability').delete().eq('id', slotId);
            if (error) throw error;
            toast.success("Слот удален!");
            setAvailability(prev => prev.filter(s => s.id !== slotId));
        } catch (error) { toast.error("Ошибка удаления: " + error.message);
        } finally { setIsSubmitting(false); }
    };

    const handleBookingStatusUpdate = async (bookingId, newStatus, reason = '') => {
        setIsSubmitting(true);
        const updatePayload = { status: newStatus, notes: reason || null };
        try {
            const { data, error } = await supabase.from('bookings').update(updatePayload).eq('id', bookingId).select('*, services(*)').single();
            if (error) throw error;
            setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
            toast.success("Статус записи обновлен!");
            if (cancellationModal.isOpen) {
                setCancellationModal({ isOpen: false, bookingId: null });
                setCancellationReason('');
            }
        } catch (error) { toast.error("Ошибка обновления: " + error.message);
        } finally { setIsSubmitting(false); }
    };
    
    const dailySchedule = useMemo(() => {
        const dateString = selectedDate.toISOString().split('T')[0];
        const dayBookings = bookings.filter(b => b.booking_date === dateString && (b.status === 'pending' || b.status === 'confirmed')).map(b => ({ ...b, type: 'booking' }));
        const dayAvailability = availability.filter(a => a.date === dateString).map(a => ({ ...a, type: 'availability' }));
        const combined = [...dayBookings, ...dayAvailability];
        return combined.sort((a, b) => {
            const timeA = a.type === 'booking' ? a.booking_start_time : a.start_time;
            const timeB = b.type === 'booking' ? b.booking_start_time : b.start_time;
            return timeA.localeCompare(timeB);
        });
    }, [selectedDate, bookings, availability]);

    const archiveBookings = useMemo(() => {
        return bookings.filter(b => !['pending', 'confirmed'].includes(b.status)).sort((a,b) => new Date(b.booking_date) - new Date(a.booking_date));
    }, [bookings]);

    const allConfirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null;
        const dateString = date.toISOString().split('T')[0];
        const hasConfirmed = allConfirmedBookings.some(b => b.booking_date === dateString);
        const hasPending = bookings.some(b => b.booking_date === dateString && b.status === 'pending');
        const hasSlot = availability.some(a => a.date === dateString);
        const classes = [];
        if (hasConfirmed) classes.push('has-confirmed-booking');
        if (hasPending && !hasConfirmed) classes.push('has-pending-booking');
        if (hasSlot) classes.push('has-slot');
        return classes.join(' ');
    };
    return (
        <>
            <div className="master-dashboard">
                <motion.div className="dashboard-calendar-panel" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                    <Calendar onChange={setSelectedDate} value={selectedDate} minDate={new Date()} tileClassName={tileClassName} prev2Label={null} next2Label={null} />
                    <button className="archive-button" onClick={() => setShowArchive(true)}> <ArchiveIcon /> <span>Архив записей</span> </button>
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
                            {!loading && dailySchedule.map(item => (
                                <ScheduleItem 
                                    key={`${item.type}-${item.id}`} 
                                    item={item} 
                                    onStatusUpdate={handleBookingStatusUpdate} 
                                    onCancelClick={() => setCancellationModal({ isOpen: true, bookingId: item.id })}
                                    onDeleteSlot={handleDeleteSlot}
                                    isSubmitting={isSubmitting}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    <AddSlotForm onAddSlot={handleAddSlot} isSubmitting={isSubmitting} dailySchedule={dailySchedule} />
                </motion.div>
            </div>
            
            <AnimatePresence>
                {showArchive && (
                    <Modal title="Архив записей" onClose={() => setShowArchive(false)}>
                        <div className="archive-list">
                            {archiveBookings.length > 0 ? archiveBookings.map(b => (
                                <div key={b.id} className={`archive-item status-${statusMap[b.status]?.className || ''}`}>
                                    <div className='archive-item-info'>
                                        <strong>{new Date(b.booking_date).toLocaleDateString()} в {b.booking_start_time.slice(0,5)}</strong>
                                        <span>{b.client_name} - {b.services?.name}</span>
                                    </div>
                                    <span className='archive-item-status'>{statusMap[b.status]?.text}</span>
                                </div>
                            )) : <p>Архив пуст.</p>}
                        </div>
                    </Modal>
                )}
                {cancellationModal.isOpen && (
                     <Modal title="Причина отмены записи" onClose={() => setCancellationModal({isOpen: false, bookingId: null})}>
                        <div className="cancellation-form">
                            <textarea 
                                placeholder="Например: Клиент попросил перенести, запись будет пересоздана на другую дату."
                                value={cancellationReason}
                                onChange={e => setCancellationReason(e.target.value)}
                                rows={4}
                            />
                            <button 
                                className="confirm-cancellation-btn"
                                disabled={isSubmitting || !cancellationReason.trim()}
                                onClick={() => handleBookingStatusUpdate(cancellationModal.bookingId, 'cancelled_by_master', cancellationReason)}
                            >Отменить запись</button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
}

// --- УНИФИЦИРОВАННЫЙ КОМПОНЕНТ ДЛЯ ЭЛЕМЕНТА РАСПИСАНИЯ ---
const ScheduleItem = ({ item, onStatusUpdate, onCancelClick, onDeleteSlot, isSubmitting }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const isBooking = item.type === 'booking';
    const isBreak = item.type === 'availability' && item.is_booked;

    // Определяем классы, время и детали в зависимости от типа элемента
    let itemClass = 'schedule-item';
    let timeDisplay, title, subtitle;

    if (isBooking) {
        const statusInfo = statusMap[item.status];
        itemClass += ` booking-item status-${statusInfo.className}`;
        timeDisplay = `${item.booking_start_time.slice(0, 5)} - ${item.booking_end_time.slice(0, 5)}`;
        title = item.services?.name || 'Услуга';
        subtitle = `${item.client_name} - ${item.client_phone}`;
    } else { // Это availability
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
                    {isBooking && item.status === 'pending' && (
                        <>
                            <button title="Подтвердить" className="item-btn confirm" onClick={() => onStatusUpdate(item.id, 'confirmed')} disabled={isSubmitting}>✓</button>
                            <button title="Отклонить" className="item-btn cancel" onClick={() => onStatusUpdate(item.id, 'cancelled_by_master')} disabled={isSubmitting}>×</button>
                        </>
                    )}
                    {isBooking && item.status === 'confirmed' && (
                        <div className='actions-menu-wrapper' ref={menuRef}>
                            <button className="item-btn more" onClick={() => setMenuOpen(p => !p)}><MoreHorizontalIcon/></button>
                        </div>
                    )}
                    {!isBooking && (
                         <button title="Удалить" className="item-btn delete" onClick={() => onDeleteSlot(item.id)} disabled={isSubmitting}><TrashIcon /></button>
                    )}
                </div>
            </div>
            {isBooking && item.status === 'confirmed' && menuOpen && (
                <div className="actions-menu-mobile">
                     <button onClick={() => { onCancelClick(); setMenuOpen(false); }}>Отменить запись</button>
                     <button onClick={() => { onStatusUpdate(item.id, 'completed'); setMenuOpen(false); }}>Завершить</button>
                </div>
            )}
        </motion.div>
    );
};

// --- ОСТАЛЬНЫЕ ДОЧЕРНИЕ КОМПОНЕНТЫ ---

const AddSlotForm = ({ onAddSlot, isSubmitting, dailySchedule }) => {
    const [startTime, setStartTime] = useState('09:00');

    useEffect(() => {
        if (dailySchedule.length > 0) {
            const lastItem = dailySchedule[dailySchedule.length - 1];
            const lastEndTime = (lastItem.type === 'booking' ? lastItem.booking_end_time : lastItem.end_time) || '09:00';
            setStartTime(lastEndTime.slice(0, 5));
        } else { setStartTime('09:00'); }
    }, [dailySchedule]);

    const addDuration = (time, durationMinutes) => {
        const [h, m] = time.split(':').map(Number);
        const totalMinutes = h * 60 + m + durationMinutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const handleSubmit = (durationMinutes, isBreak = false) => {
        const endTime = addDuration(startTime, durationMinutes);
        if(startTime >= endTime) { toast.error("Ошибка длительности"); return; }
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
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);
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

// <<< ИСПРАВЛЕНИЕ: Убираем портал из меню, делаем его адаптивным через CSS >>>
// Этот компонент больше не нужен, его логика встроена в BookingItem
// const ActionsMenu = ({...}) 

export default MasterScheduleManager;