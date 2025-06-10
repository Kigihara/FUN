import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css'; 
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { format, startOfDay } from 'date-fns';

function BookingCalendar({ selectedService, onDateTimeConfirm }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [masterAvailability, setMasterAvailability] = useState([]); 
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); 

  useEffect(() => {
    const fetchMasterAvailability = async () => {
      setCalendarLoading(true);
      setCalendarError(null);
      try {
        const { data, error } = await supabase
          .from('availability')
          .select('date, start_time, end_time')
          .eq('is_booked', false)
          .gte('date', format(new Date(), 'yyyy-MM-dd'));

        if (error) throw error;
        setMasterAvailability(data || []);
      } catch (_) { // Используем _ для неиспользуемой переменной
        setCalendarError('Не удалось загрузить расписание.');
        toast.error('Не удалось загрузить расписание.');
      } finally {
        setCalendarLoading(false);
      }
    };
    fetchMasterAvailability();
  }, []);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const timeToMinutes = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; };

    return masterAvailability
      .filter(slot => {
        if (slot.date !== dateString) return false;
        const serviceDuration = selectedService.duration_minutes;
        const slotDuration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
        return serviceDuration <= slotDuration;
      })
      .map(slot => slot.start_time.slice(0, 5))
      .sort();
  }, [selectedDate, selectedService, masterAvailability]);

  const handleDateChange = (date) => {
    const startOfSelectedDate = startOfDay(date);
    setCurrentDate(startOfSelectedDate); 
    setSelectedDate(startOfSelectedDate); 
    setSelectedTimeSlot(null);
    onDateTimeConfirm(startOfSelectedDate, null);
  };
  
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = format(startOfDay(date), 'yyyy-MM-dd');
      if (masterAvailability.some(slot => slot.date === dateString)) {
        return 'available-day'; 
      }
    }
    return null;
  };

  const tileDisabled = ({ date }) => {
    return date < startOfDay(new Date());
  };

  const handleTimeSlotClick = (time) => {
    setSelectedTimeSlot(time);
    if (onDateTimeConfirm && selectedDate) {
      onDateTimeConfirm(selectedDate, time); 
    }
  };

  if (calendarLoading) return <div className="calendar-loading">Загрузка расписания...</div>;
  if (calendarError) return <p className="calendar-error">{calendarError}</p>;
  
  return (
    <div className="booking-calendar-container">
      <div className="calendar-wrapper">
        <Calendar
          onChange={handleDateChange}
          value={currentDate}
          minDate={new Date()}
          tileClassName={tileClassName}
          tileDisabled={tileDisabled}
          prev2Label={null} 
          next2Label={null}
        />
      </div>

      {selectedDate && selectedService && (
        <div className="time-slots-wrapper">
          <h3>
            Доступное время на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </h3>
          {availableTimeSlots.length > 0 ? (
            <div className="time-slots-grid">
              {availableTimeSlots.map((time, index) => (
                <button 
                  key={index} 
                  className={`time-slot-button ${selectedTimeSlot === time ? 'selected' : ''}`}
                  onClick={() => handleTimeSlotClick(time)}
                >
                  {time} 
                </button>
              ))}
            </div>
          ) : (
            <p>{`На выбранную дату нет доступного времени для услуги "${selectedService.name}".`}</p>
          )}
        </div>
      )}
      {!selectedService && selectedDate && (
          <p className="info-message">Пожалуйста, выберите услугу, чтобы увидеть доступное время.</p>
      )}
    </div>
  );
}

export default BookingCalendar;