import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css';
import { supabase } from '../supabaseClient';

// ... (вспомогательные функции timeToMinutes, minutesToTime остаются без изменений)
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};


// Добавляем onDateTimeConfirm в пропсы
function BookingCalendar({ selectedService, onDateTimeConfirm }) { 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [masterAvailability, setMasterAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [generatedTimeSlots, setGeneratedTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // ... (useEffect для fetchMasterAvailability остается без изменений)
  useEffect(() => {
    const fetchMasterAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('availability')
          .select('date, start_time, end_time')
          .eq('is_booked', false);

        if (fetchError) throw fetchError;

        const availabilityByDate = data.reduce((acc, slot) => {
          const dateStr = slot.date;
          if (!acc[dateStr]) acc[dateStr] = [];
          acc[dateStr].push({ start: slot.start_time, end: slot.end_time });
          acc[dateStr].sort((a, b) => a.start.localeCompare(b.start));
          return acc;
        }, {});
        setMasterAvailability(availabilityByDate);
      } catch (err) {
        console.error('Ошибка при загрузке доступности мастера:', err);
        setError('Не удалось загрузить расписание. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    fetchMasterAvailability();
  }, []);


  const generateSlotsForDate = useCallback((date, serviceDuration) => {
    // ... (логика generateSlotsForDate остается без изменений)
    if (!date || !serviceDuration || !masterAvailability) {
      setGeneratedTimeSlots([]);
      return;
    }

    const dateString = date.toISOString().split('T')[0];
    const dayAvailabilityIntervals = masterAvailability[dateString] || [];
    const slots = [];

    for (const interval of dayAvailabilityIntervals) {
      let currentSlotStartMinutes = timeToMinutes(interval.start);
      const intervalEndMinutes = timeToMinutes(interval.end);

      while (currentSlotStartMinutes + serviceDuration <= intervalEndMinutes) {
        slots.push(minutesToTime(currentSlotStartMinutes));
        currentSlotStartMinutes += 30; 
      }
    }
    setGeneratedTimeSlots(slots.filter((slot, index, self) => self.indexOf(slot) === index));
  }, [masterAvailability]);

  useEffect(() => {
    if (selectedDate && selectedService?.duration_minutes) {
      generateSlotsForDate(selectedDate, selectedService.duration_minutes);
      setSelectedTimeSlot(null); 
      if (onDateTimeConfirm) { // Сбрасываем подтвержденное время в родителе, если дата сменилась
         onDateTimeConfirm(selectedDate, null);
      }
    } else {
      setGeneratedTimeSlots([]);
       if (onDateTimeConfirm) { // Сбрасываем и если услуга убрана
         onDateTimeConfirm(null, null);
      }
    }
  }, [selectedDate, selectedService, generateSlotsForDate, onDateTimeConfirm]);


  const handleDateChange = (date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    // setSelectedTimeSlot(null); // Уже делается в useEffect
    // if (onDateTimeConfirm) { // Сброс времени в родителе при смене даты
    //   onDateTimeConfirm(date, null); 
    // }
  };
  
  // ... (tileClassName, tileDisabled остаются без изменений)
  const tileClassName = ({ date, view }) => {
    if (view === 'month' && masterAvailability) {
      const dateString = date.toISOString().split('T')[0];
      if (masterAvailability[dateString] && masterAvailability[dateString].length > 0) {
        return 'available-day-master';
      }
    }
    return null;
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      if (date < today) return true;
    }
    return false;
  };


  const handleTimeSlotClick = (time) => {
    setSelectedTimeSlot(time);
    // Вызываем callback для передачи выбранной даты и времени в родительский компонент
    if (onDateTimeConfirm && selectedDate) {
      onDateTimeConfirm(selectedDate, time);
    }
  };

  if (loading) return <div className="calendar-loading">Загрузка расписания...</div>;
  if (error) return <p className="calendar-error">{error}</p>;

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
            Доступное время на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} для "{selectedService.name}"
          </h3>
          {generatedTimeSlots.length > 0 ? (
            <div className="time-slots-grid">
              {generatedTimeSlots.map((time, index) => (
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
            <p>На выбранную дату нет доступного времени для данной услуги.</p>
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