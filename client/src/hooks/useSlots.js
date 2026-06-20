export function computeSlots(scheduleStart, scheduleEnd, bookedAppointments, slotDurationMinutes = 30) {
  const toMinutes = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const startMin = toMinutes(scheduleStart);
  const endMin = toMinutes(scheduleEnd);
  const slots = [];

  for (let min = startMin; min + slotDurationMinutes <= endMin; min += slotDurationMinutes) {
    const slotStart = min;
    const slotEnd = min + slotDurationMinutes;

    const isTaken = bookedAppointments.some(appt => {
      const apptStart = toMinutes(appt.start_time);
      const apptEnd = toMinutes(appt.end_time);
      return apptStart < slotEnd && apptEnd > slotStart;
    });

    slots.push({
      start: `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`,
      end: `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}:00`,
      label: formatTime(min),
      taken: isTaken,
    });
  }
  return slots;
}

function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${period}`;
}
