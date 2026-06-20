import { computeSlots } from '../../hooks/useSlots';

export default function SlotPicker({ schedules, bookedSlots, selectedDate, selectedSlot, onSelectSlot }) {
  if (!selectedDate || !schedules?.length) return null;

  // Determine day-of-week (0=Monday in our system, JS getDay 0=Sunday)
  const jsDay = new Date(selectedDate).getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday

  // Find matching schedule(s) for this day
  const daySchedules = schedules.filter(
    s => s.day_of_week === dayOfWeek && s.is_available
  );

  if (!daySchedules.length) {
    return <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No availability on this day.</p>;
  }

  // Compute slots from all schedule windows
  const allSlots = daySchedules.flatMap(schedule =>
    computeSlots(schedule.start_time, schedule.end_time, bookedSlots || [])
  );

  if (!allSlots.length) {
    return <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No available time slots.</p>;
  }

  return (
    <div className="slot-picker-grid">
      {allSlots.map(slot => (
        <button
          key={slot.start}
          type="button"
          className={`slot-pill ${slot.taken ? 'taken' : ''} ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
          disabled={slot.taken}
          onClick={() => !slot.taken && onSelectSlot(slot)}
        >
          {slot.label}
          {slot.taken && <span style={{ marginLeft: 4, fontSize: '0.65rem' }}>(Taken)</span>}
        </button>
      ))}
    </div>
  );
}
