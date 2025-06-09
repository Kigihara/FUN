// src/pages/MasterScheduleManager.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Calendar from 'react-calendar';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import 'react-calendar/dist/Calendar.css';
import './MasterScheduleManager.css';

// Иконки
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const SlotSkeleton = () => (
    <li className="slot-item skeleton">
        <div className="skeleton-text" style={{width: '120px'}}></div>
        <div className="skeleton-icon"></div>
    </li>
);


function MasterScheduleManager() {
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const [newStartTime, setNewStartTime] = useState('10:00');
    const [newEndTime, setNewEndTime] = useState('20:00');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const slotsListRef = useRef(null);
    const isTimeInvalid = newStartTime >= newEndTime;

    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('availability')
                .select('id, date, start_time, end_time, is_booked')
                .order('start_time', { ascending: true });

            if (error) throw error;
            setAvailability(data || []);
        } catch (error) {
            toast.error('Ошибка при загрузке расписания: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    const handleAddSlot = async (e) => {
        e.preventDefault();
        if (isTimeInvalid) {
            toast.error('Время начала должно быть раньше времени окончания.');
            return;
        }

        setIsSubmitting(true);
        const dateString = selectedDate.toISOString().split('T')[0];

        try {
            const { data, error } = await supabase
                .from('availability')
                .insert([{ date: dateString, start_time: newStartTime, end_time: newEndTime }])
                .select()
                .single();
            
            if (error) throw error;

            toast.success('Слот успешно добавлен!');
            setAvailability(prev => [...prev, data].sort((a, b) => new Date(a.date) - new Date(b.date) || a.start_time.localeCompare(b.start_time)));
            
            setNewStartTime('10:00');
            setNewEndTime('20:00');

            setTimeout(() => {
                const addedElement = slotsListRef.current?.querySelector(`[data-slot-id="${data.id}"]`);
                addedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

        } catch (error) {
            if (error.code === '23505') {
                 toast.error('Такой временной слот уже существует.');
            } else {
                 toast.error('Ошибка при добавлении слота: ' + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот слот?')) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('availability').delete().eq('id', slotId);
            if (error) throw error;
            toast.success('Слот успешно удален.');
            setAvailability(prev => prev.filter(slot => slot.id !== slotId));
        } catch (error) {
            toast.error('Ошибка при удалении слота: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const slotsForSelectedDate = availability.filter(
        slot => slot.date === selectedDate.toISOString().split('T')[0]
    );

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
          const dateString = date.toISOString().split('T')[0];
          if (availability.some(slot => slot.date === dateString)) {
            return 'has-availability';
          }
        }
        return null;
    };
    
    const selectedDateString = selectedDate.toISOString().split('T')[0];

    return (
        <div className="master-schedule-container container">
            <h2 className="master-schedule-title">Управление расписанием</h2>
            <p className="master-schedule-subtitle">Выберите дату в календаре, чтобы просмотреть и отредактировать доступные временные интервалы.</p>
            
            <div className="schedule-content-wrapper">
                <motion.div className="calendar-panel" initial={{opacity: 0, x: -50}} animate={{opacity: 1, x: 0}} transition={{duration: 0.5, delay: 0.2}}>
                    <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        minDate={new Date()}
                        tileClassName={tileClassName}
                        prev2Label={null}
                        next2Label={null}
                    />
                </motion.div>

                <motion.div className="slots-panel" initial={{opacity: 0, x: 50}} animate={{opacity: 1, x: 0}} transition={{duration: 0.5, delay: 0.4}}>
                    <div className="slots-list-section">
                        <h3 className="slots-panel-title">
                            Слоты на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <ul 
                            className="slots-list" 
                            ref={slotsListRef} 
                            key={selectedDateString} 
                        >
                            <AnimatePresence>
                                {loading ? (
                                    <>
                                        <SlotSkeleton />
                                        <SlotSkeleton />
                                        <SlotSkeleton />
                                    </>
                                ) : slotsForSelectedDate.length > 0 ? (
                                    slotsForSelectedDate.map(slot => (
                                        <motion.li 
                                            key={slot.id} 
                                            data-slot-id={slot.id}
                                            className={`slot-item ${slot.is_booked ? 'booked' : ''}`}
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                                        >
                                            <span className="slot-time">
                                                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                            </span>
                                            {slot.is_booked ? (
                                                <span className="slot-status-booked">Забронировано</span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleDeleteSlot(slot.id)} 
                                                    className="delete-slot-btn"
                                                    disabled={isSubmitting}
                                                    aria-label={`Удалить слот`}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </motion.li>
                                    ))
                                ) : (
                                    <motion.p 
                                      className="no-slots-message"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1, transition: { delay: 0.2 }}}
                                    >
                                        На эту дату нет добавленных слотов.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </ul>
                    </div>
                    
                    <div className="add-slot-section">
                        <h3 className="slots-panel-title">Добавить новый интервал</h3>
                        <form onSubmit={handleAddSlot} className="add-slot-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="start-time">Начало</label>
                                    <input type="time" id="start-time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} required step="1800" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="end-time">Конец</label>
                                    <input type="time" id="end-time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} required step="1800" />
                                </div>
                            </div>
                            <button type="submit" className="add-slot-btn" disabled={isSubmitting || isTimeInvalid}>
                                <PlusIcon />
                                {isSubmitting ? 'Добавление...' : 'Добавить'}
                            </button>
                            {isTimeInvalid && <p className="time-error-notice">Время начала не может быть позже или равно времени окончания</p>}
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default MasterScheduleManager;