import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import Calendar from 'react-calendar';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import { startOfDay } from 'date-fns';

import ConfirmModal from '../components/ConfirmModal';
import DailySchedule from '../components/DailySchedule';
import AddSlotForm from '../components/AddSlotForm';
import ArchiveModal from '../components/ArchiveModal';

import 'react-calendar/dist/Calendar.css';
import './MasterScheduleManager.css';

const ArchiveIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>);

const toYYYYMMDD = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const correctedDate = new Date(d.getTime() - (offset*60*1000));
    return correctedDate.toISOString().split('T')[0];
};

function MasterScheduleManager() {
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
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

    const dailySchedule = useMemo(() => {
        const dateString = toYYYYMMDD(selectedDate);
        const dayBookings = bookings.filter(b => b.booking_date === dateString && (b.status === 'pending' || b.status === 'confirmed')).map(b => ({ ...b, type: 'booking' }));
        const dayAvailability = availability.filter(a => a.date === dateString).map(a => ({ ...a, type: 'availability' }));
        const combined = [...dayBookings, ...dayAvailability];
        return combined.sort((a, b) => {
            const timeA = a.type === 'booking' ? a.booking_start_time : a.start_time;
            const timeB = b.type === 'booking' ? b.booking_start_time : b.start_time;
            return timeA.localeCompare(timeB);
        });
    }, [selectedDate, bookings, availability]);

    const checkOverlap = (newStartStr, newEndStr) => {
        const timeToMinutes = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; };
        const newStart = timeToMinutes(newStartStr); const newEnd = timeToMinutes(newEndStr);
        for (const item of dailySchedule) {
            const existingStart = timeToMinutes(item.type === 'booking' ? item.booking_start_time : item.start_time);
            const existingEnd = timeToMinutes(item.type === 'booking' ? item.booking_end_time : item.end_time);
            if (newStart < existingEnd && newEnd > existingStart) return true;
        }
        return false;
    };

    const handleAddSlot = async (startTime, endTime, isBreak = false) => {
        setIsSubmitting(true);
        if (checkOverlap(startTime, endTime)) {
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
    
    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null;
        const dateString = toYYYYMMDD(date);
        const hasConfirmed = bookings.some(b => b.booking_date === dateString && b.status === 'confirmed');
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
                    <Calendar onChange={date => setSelectedDate(startOfDay(date))} value={selectedDate} minDate={new Date()} tileClassName={tileClassName} prev2Label={null} next2Label={null} />
                    <button className="archive-button" onClick={() => setShowArchiveModal(true)}> <ArchiveIcon /> <span>Архив записей</span> </button>
                </motion.div>
                <motion.div className="dashboard-schedule-panel" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="schedule-panel-header">
                        <h3>Расписание на</h3>
                        <h2>{selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                    </div>
                    <DailySchedule 
                        schedule={dailySchedule} loading={loading}
                        onStatusUpdate={handleBookingStatusUpdate} 
                        onCancelClick={(bookingId) => { setBookingToCancel(bookingId); setShowCancellationModal(true); }}
                        onDeleteRequest={handleDeleteRequest}
                        isSubmitting={isSubmitting}
                    />
                    <AddSlotForm onAddSlot={handleAddSlot} isSubmitting={isSubmitting} dailySchedule={dailySchedule} />
                </motion.div>
            </div>
            <AnimatePresence>
                {showArchiveModal && <ArchiveModal allBookings={bookings} onClose={() => setShowArchiveModal(false)} onDeleteRequest={handleDeleteRequest} />}
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

export default MasterScheduleManager;