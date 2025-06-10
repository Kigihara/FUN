import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Импортируй иконки сюда, чтобы компонент был самодостаточным
const TrashIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const MoreHorizontalIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>);
const CoffeeIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const CancelIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

const statusMap = {
  pending: { text: 'Ожидает', className: 'pending' },
  confirmed: { text: 'Подтверждена', className: 'confirmed' },
  cancelled_by_master: { text: 'Отменена', className: 'cancelled' },
  completed: { text: 'Завершена', className: 'completed' },
};

function ScheduleItem({ item, onStatusUpdate, onCancelClick, onDeleteRequest, isSubmitting }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const itemRef = useRef(null);

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemRef.current && !itemRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [itemRef]);

    return (
        <motion.div ref={itemRef} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, transition: {duration: 0.2} }} className={itemClass}>
            <div className="item-main-content">
                <span className="item-time">{timeDisplay}</span>
                <div className="item-details">
                    <p className="item-title">{isBreak && <CoffeeIcon />} {title}</p>
                    {subtitle && <p className="item-subtitle">{subtitle}</p>}
                </div>
                <div className="item-actions">
                    {isBooking && item.status === 'pending' && (
                        <>
                            <button title="Подтвердить" className="item-btn confirm" onClick={() => onStatusUpdate(item.id, 'confirmed')} disabled={isSubmitting}><CheckIcon/></button>
                            <button title="Отклонить" className="item-btn cancel" onClick={() => onDeleteRequest(item.id, 'booking', 'заявку')} disabled={isSubmitting}><CancelIcon/></button>
                        </>
                    )}
                    {isBooking && item.status === 'confirmed' && (
                        <div className='actions-menu-wrapper'>
                            <button className="item-btn more" onClick={() => setMenuOpen(p => !p)}><MoreHorizontalIcon/></button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div className="actions-menu" initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}}>
                                        <button onClick={() => { onCancelClick(); setMenuOpen(false); }}>Отменить запись</button>
                                        <button onClick={() => { onStatusUpdate(item.id, 'completed'); setMenuOpen(false); }}>Завершить</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    {!isBooking && ( <button title="Удалить" className="item-btn delete" onClick={() => onDeleteRequest(item.id, 'slot', 'слот')} disabled={isSubmitting}><TrashIcon /></button> )}
                </div>
            </div>
        </motion.div>
    );
};

export default ScheduleItem;