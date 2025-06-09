// src/components/BookingCalendar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css'; 
import { supabase } from '../supabaseClient';

// Вспомогательные функции для времени
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    // console.warn('[timeToMinutes] Invalid time string provided:', timeStr);
    return 0; 
  }
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) {
    // console.warn('[timeToMinutes] Could not parse hours or minutes from:', timeStr);
    return 0;
  }
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) {
    // console.warn('[minutesToTime] Invalid totalMinutes provided:', totalMinutes);
    return '00:00'; 
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

function BookingCalendar({ selectedService, onDateTimeConfirm }) { 
  console.log('[BookingCalendar] Render. Selected Service:', selectedService?.name);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [masterAvailability, setMasterAvailability] = useState({}); 
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [generatedTimeSlots, setGeneratedTimeSlots] = useState([]); 
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); 

  useEffect(() => {
    console.log('[BookingCalendar masterAvailability useEffect] Running. SelectedService ID:', selectedService?.id);
    if (selectedService && selectedService.id) {
      const fetchMasterAvailability = async () => {
        console.log('[BookingCalendar fetchMasterAvailability] Setting calendarLoading to true.');
        setCalendarLoading(true);
        setCalendarError(null);
        setMasterAvailability({}); 
        try {
          console.log('[BookingCalendar fetchMasterAvailability] Attempting to fetch "availability".');
          const { data, error: fetchError } = await supabase
            .from('availability') 
            .select('date, start_time, end_time, is_booked')
            .eq('is_booked', false); 

          console.log('[BookingCalendar fetchMasterAvailability] Supabase response. Error:', fetchError, 'Data:', data);
          if (fetchError) throw fetchError;

          const availabilityByDate = (data || []).reduce((acc, slot) => {
            const dateStr = slot.date;
            if (!acc[dateStr]) acc[dateStr] = [];
            if (typeof slot.start_time === 'string' && typeof slot.end_time === 'string') {
                acc[dateStr].push({ start: slot.start_time, end: slot.end_time });
            } else {
                console.warn(`[BookingCalendar] Invalid time format for slot on ${dateStr}:`, slot);
            }
            if (acc[dateStr].length > 1) {
                acc[dateStr].sort((a, b) => a.start.localeCompare(b.start));
            }
            return acc;
          }, {});
          
          console.log('[BookingCalendar fetchMasterAvailability] Processed availabilityByDate:', availabilityByDate);
          setMasterAvailability(availabilityByDate);
        } catch (err) {
          console.error('[BookingCalendar fetchMasterAvailability] Fetching error:', err.message, err);
          setCalendarError('Не удалось загрузить расписание.');
        } finally {
          console.log('[BookingCalendar fetchMasterAvailability] Setting calendarLoading to false.');
          setCalendarLoading(false);
        }
      };
      fetchMasterAvailability();
    } else {
      setMasterAvailability({});
      setGeneratedTimeSlots([]);
      setCalendarLoading(false); 
      console.log('[BookingCalendar masterAvailability useEffect] No selected service, clearing data.');
    }
  }, [selectedService]); // Зависимость от selectedService

  const generateSlotsForDate = useCallback((dateToGenerate, serviceDurationMinutes) => {
    // ... (код generateSlotsForDate как был, без изменений) ...
    if (!dateToGenerate || !serviceDurationMinutes || Object.keys(masterAvailability).length === 0) {
      console.log('[BookingCalendar generateSlotsForDate] Conditions not met. Clearing slots.');
      setGeneratedTimeSlots([]);
      return;
    }
    const dateString = dateToGenerate.toISOString().split('T')[0];
    console.log(`[BookingCalendar generateSlotsForDate] Generating for date: ${dateString}, duration: ${serviceDurationMinutes} min.`);

    const dayAvailabilityIntervals = masterAvailability[dateString] || [];
    console.log(`[BookingCalendar generateSlotsForDate] Master intervals for ${dateString}:`, dayAvailabilityIntervals);
    const slots = [];

    for (const interval of dayAvailabilityIntervals) {
      let currentPotentialSlotStart = timeToMinutes(interval.start);
      const intervalEnd = timeToMinutes(interval.end);

      while (currentPotentialSlotStart + serviceDurationMinutes <= intervalEnd) {
        const slotStartTimeStr = minutesToTime(currentPotentialSlotStart);
        slots.push(slotStartTimeStr);
        currentPotentialSlotStart += 30; 
      }
    }
    const uniqueSlots = slots.filter((slot, index, self) => self.indexOf(slot) === index);
    console.log(`[BookingCalendar generateSlotsForDate] Generated unique slots for ${dateString}:`, uniqueSlots);
    setGeneratedTimeSlots(uniqueSlots);
  }, [masterAvailability]); 

  useEffect(() => {
    console.log('[BookingCalendar generateSlots useEffect] selectedDate or selectedService changed.');
    if (selectedDate && selectedService?.duration_minutes) {
      console.log('[BookingCalendar generateSlots useEffect] Valid data, calling generateSlotsForDate.');
      generateSlotsForDate(selectedDate, selectedService.duration_minutes);
      setSelectedTimeSlot(null); 
      if (onDateTimeConfirm) { 
         onDateTimeConfirm(selectedDate, null); 
      }
    } else {
      console.log('[BookingCalendar generateSlots useEffect] Invalid data, clearing generated slots.');
      setGeneratedTimeSlots([]);
      if (onDateTimeConfirm) {
         onDateTimeConfirm(null, null); 
      }
    }
  }, [selectedDate, selectedService, generateSlotsForDate, onDateTimeConfirm]);

  const handleDateChange = (date) => {
    console.log('[BookingCalendar handleDateChange] New date selected:', date.toISOString().split('T')[0]);
    setCurrentDate(date); 
    setSelectedDate(date); 
  };
  
  const tileClassName = ({ date, view }) => {
    if (view === 'month' && Object.keys(masterAvailability).length > 0) {
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
      if (date < today) { 
        return true;
      }
    }
    return false;
  };

  const handleTimeSlotClick = (time) => {
    console.log('[BookingCalendar handleTimeSlotClick] Time slot selected:', time);
    setSelectedTimeSlot(time);
    if (onDateTimeConfirm && selectedDate) {
      onDateTimeConfirm(selectedDate, time); 
    }
  };

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