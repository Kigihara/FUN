import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Иконки можно скопировать из MasterScheduleManager.jsx или импортировать из одного общего файла


function AddSlotForm({ onAddSlot, isSubmitting, dailySchedule }) {
    const [startTime, setStartTime] = useState('09:00');

    useEffect(() => {
        if (dailySchedule && dailySchedule.length > 0) {
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

export default AddSlotForm;