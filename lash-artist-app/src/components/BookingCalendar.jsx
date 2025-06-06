import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Стили по умолчанию
import './BookingCalendar.css'; // Наши кастомные стили
import { supabase } from '../supabaseClient';

// Принимаем selectedService как пропс
function BookingCalendar({ selectedService }) { 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableDates, setAvailableDates] = useState({}); // Изменили на объект для удобного доступа
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimesForSelectedDate, setAvailableTimesForSelectedDate] = useState([]);

  // Выводим в консоль выбранную услугу, чтобы убедиться, что она передается
  // useEffect(() => {
  //   if (selectedService) {
  //     console.log("Выбранная услуга в BookingCalendar:", selectedService);
  //   }
  // }, [selectedService]);

  // Загрузка доступных дат и времени
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        // Получаем все НЕ забронированные записи из availability
        // На будущее: здесь можно будет фильтровать по master_id, если их несколько
        const { data, error: fetchError } = await supabase
          .from('availability')
          .select('date, start_time, end_time, is_booked')
          .eq('is_booked', false)
          // Опционально: можно добавить фильтр по дате, чтобы не грузить слишком много данных
          // .gte('date', new Date().toISOString().split('T')[0]) // Начиная с сегодняшнего дня

        if (fetchError) {
          throw fetchError;
        }
        
        // Группируем слоты по датам
        // Ключ - строка даты 'YYYY-MM-DD', значение - массив объектов {start, end}
        const slotsByDate = data.reduce((acc, slot) => {
          const dateStr = slot.date; // Supabase возвращает дату в формате YYYY-MM-DD
          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          // TODO: На следующих этапах здесь нужно будет учитывать длительность selectedService
          // и генерировать конкретные временные слоты, а не просто интервалы.
          // Пока что просто сохраняем интервалы как есть.
          acc[dateStr].push({ 
            start: slot.start_time, 
            end: slot.end_time 
            // Можно добавить service_duration_minutes: selectedService?.duration_minutes если нужно уже сейчас
          });
          // Сортируем слоты по времени начала
          acc[dateStr].sort((a, b) => a.start.localeCompare(b.start));
          return acc;
        }, {});
        
        setAvailableDates(slotsByDate);

      } catch (err) {
        console.error('Ошибка при загрузке доступных слотов:', err);
        setError('Не удалось загрузить расписание. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, []); // Пока что массив зависимостей пуст, загружаем один раз. Позже можно добавить selectedService, если логика будет зависеть от него

  const handleDateChange = (date) => {
    setCurrentDate(date);
    setSelectedDate(date); 
    
    const dateString = date.toISOString().split('T')[0]; 
    if (availableDates[dateString]) {
        // TODO: Фильтрация и генерация слотов на основе selectedService.duration_minutes
        // Пока что просто отображаем все доступные интервалы для этой даты
        setAvailableTimesForSelectedDate(availableDates[dateString]);
    } else {
        setAvailableTimesForSelectedDate([]);
    }
  };
  
  // Функция для стилизации дней в календаре
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      // Если для этой даты есть доступные слоты в нашем объекте availableDates
      if (availableDates[dateString] && availableDates[dateString].length > 0) {
        return 'available-day';
      }
    }
    return null;
  };

  // Функция для блокировки дней
  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      if (date < today) { // Блокируем прошлые даты
        return true;
      }
      // Дополнительно блокируем дни, для которых нет записи в availableDates
      // const dateString = date.toISOString().split('T')[0];
      // if (!availableDates[dateString] || availableDates[dateString].length === 0) {
      //   return true; // Блокировать, если нет доступных слотов
      // }
    }
    return false;
  };

  // Обработчик выбора времени (пока просто выводит в консоль)
  const handleTimeSelect = (timeSlot) => {
    console.log('Выбран временной слот:', timeSlot);
    console.log('Для услуги:', selectedService);
    console.log('На дату:', selectedDate);
    // Здесь будет логика перехода к следующему шагу - ввод данных клиента и подтверждение
    alert(`Вы выбрали время: ${timeSlot.start.substring(0,5)} для услуги "${selectedService.name}"`);
  };

  if (loading) {
    return <div className="calendar-loading">Загрузка расписания...</div>;
  }

  if (error) {
    return <p className="calendar-error">{error}</p>;
  }

  return (
    // Обертку <section> и её ID убрали, т.к. компонент теперь часть модального окна
    // Заголовок "Выберите дату и время" также убран, он теперь в родительском компоненте
    <div className="booking-calendar-container"> {/* Добавлен класс для возможной доп. стилизации контейнера */}
      <div className="calendar-wrapper">
        <Calendar
          onChange={handleDateChange}
          value={currentDate}
          minDate={new Date()} 
          tileClassName={tileClassName}
          tileDisabled={tileDisabled}
          // locale="ru-RU" // Раскомментируй, если настроена локализация
          prev2Label={null} 
          next2Label={null}
        />
      </div>

      {selectedDate && (
        <div className="time-slots-wrapper">
          <h3>
            Доступное время на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' /* год убрали для краткости */ })}:
          </h3>
          {availableTimesForSelectedDate.length > 0 ? (
            <div className="time-slots-grid">
              {availableTimesForSelectedDate.map((slot, index) => (
                <button 
                  key={index} 
                  className="time-slot-button"
                  onClick={() => handleTimeSelect(slot)}
                >
                  {/* Отображаем только ЧЧ:ММ из start_time */}
                  {slot.start.substring(0, 5)} 
                </button>
              ))}
            </div>
          ) : (
            <p>На выбранную дату нет доступного времени или все слоты заняты.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCalendar;