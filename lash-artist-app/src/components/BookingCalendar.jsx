// src/components/BookingCalendar.jsx
import React, { useState, useEffect } from 'react'; // <<< ИСПРАВЛЕНО ЗДЕСЬ: useCallback удален
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

function BookingCalendar({ selectedService, onDateTimeConfirm }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [masterAvailability, setMasterAvailability] = useState([]); 
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  useEffect(() => {
    const fetchMasterAvailability = async () => {
      setCalendarLoading(true);
      setCalendarError(null);
      setMasterAvailability([]);

      try {
        const { data, error: fetchError } = await supabase
          .from('availability')
          .select('id, date, start_time, end_time')
          .eq('is_booked', false);

        if (fetchError) throw fetchError;
        
        const sortedData = (data || []).sort((a,b) => new Date(a.date) - new Date(b.date) || a.start_time.localeCompare(b.start_time));
        setMasterAvailability(sortedData);

      } catch (err) {
        console.error('[BookingCalendar] Fetching error:', err.message, err);
        setCalendarError('Не удалось загрузить расписание.');
        toast.error('Не удалось загрузить расписание.');
      } finally {
        setCalendarLoading(false);
      }
    };
    
    fetchMasterAvailability();
  }, []);

  useEffect(() => {
    setSelectedTimeSlot(null);
    onDateTimeConfirm(selectedDate, null);

    if (selectedDate && selectedService) {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const slotsForDay = masterAvailability.filter(slot => {
        if (slot.date !== dateString) return false;
        
        const serviceDuration = selectedService.duration_minutes;
        const [startH, startM] = slot.start_time.split(':').map(Number);
        const [endH, endM] = slot.end_time.split(':').map(Number);
        const slotDuration = (endH * 60 + endM) - (startH * 60 + startM);
        
        return serviceDuration <= slotDuration;
      });
      
      const timeOptions = slotsForDay.map(slot => slot.start_time.slice(0, 5));
      setAvailableTimeSlots(timeOptions);

    } else {
      setAvailableTimeSlots([]);
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, masterAvailability]);


  const handleDateChange = (date) => {
    setCurrentDate(date);
    setSelectedDate(date);
  };
  
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      if (masterAvailability.some(slot => slot.date === dateString)) {
        return 'available-day'; 
      }
    }
    return null;
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return true;
      }
    }
    return false;
  };

  const handleTimeSlotClick = (time) => {
    setSelectedTimeSlot(time);
    if (onDateTimeConfirm && selectedDate) {
      onDateTimeConfirm(selectedDate, time);
    }
  };
  
  if (tileClassName && tileClassName.toString().includes('available-day-master')) {
    console.error("Найден старый класс 'available-day-master'. Пожалуйста, используйте 'available-day' в BookingCalendar.css");
  }

  if (calendarLoading) {
    return <div className="calendar-loading">Загрузка расписания...</div>;
  }

  if (calendarError) {
    return <p className="calendar-error">{calendarError}</p>;
  }
  
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