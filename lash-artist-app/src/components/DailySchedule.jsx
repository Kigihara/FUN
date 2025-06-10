import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ScheduleItem from './ScheduleItem'; // Мы создадим его следующим

function DailySchedule({ schedule, loading, ...props }) {
  if (loading) {
    return <p>Загрузка расписания...</p>;
  }

  return (
    <div className="schedule-items-list">
      <AnimatePresence>
        {!loading && schedule.length === 0 && (
          <motion.div className="empty-day-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p>На этот день нет записей или слотов.</p>
          </motion.div>
        )}
        {!loading && schedule.map((item, index) => (
          <ScheduleItem
            key={`${item.id}-${index}`}
            item={item}
            {...props}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default DailySchedule;