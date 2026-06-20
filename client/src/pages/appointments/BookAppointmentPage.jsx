import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import SlotPicker from '../../components/appointments/SlotPicker';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { listDoctors } from '../../api/doctors';
import { getBookedSlots, createAppointment } from '../../api/appointments';
import { getDayName, formatDate, formatTime } from '../../utils/format';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MiniCalendar({ availableDays, selectedDate, onSelectDate }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1);
    // JS: 0=Sun. We want 0=Mon
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ empty: true, key: `e-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const jsDay = date.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
      const isPast = date < today;
      const isAvailable = availableDays.includes(dayOfWeek) && !isPast;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate === dateStr;

      cells.push({
        key: dateStr,
        day: d,
        dateStr,
        disabled: !isAvailable,
        today: isToday,
        selected: isSelected,
      });
    }
    return cells;
  }, [viewMonth, availableDays, selectedDate]);

  const goMonth = (delta) => {
    setViewMonth(v => {
      let m = v.month + delta;
      let y = v.year;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h3>{MONTH_NAMES[viewMonth.month]} {viewMonth.year}</h3>
        <div className="calendar-nav">
          <button onClick={() => goMonth(-1)}>◀</button>
          <button onClick={() => goMonth(1)}>▶</button>
        </div>
      </div>
      <div className="calendar-grid">
        {DAY_LABELS.map(d => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}
        {days.map(cell =>
          cell.empty ? (
            <div key={cell.key} className="calendar-day empty" />
          ) : (
            <div
              key={cell.key}
              className={`calendar-day ${cell.disabled ? 'disabled' : ''} ${cell.today ? 'today' : ''} ${cell.selected ? 'selected' : ''}`}
              onClick={() => !cell.disabled && onSelectDate(cell.dateStr)}
            >
              {cell.day}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const toast = useToast();

  useEffect(() => {
    listDoctors()
      .then(res => setDoctors(res.data))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter(d =>
    d.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookedSlots([]);
    setSuccess(null);
    if (doctor.clinics.length === 1) {
      setSelectedClinic(doctor.clinics[0].id);
    } else {
      setSelectedClinic(null);
    }
  };

  const handleSelectDate = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const res = await getBookedSlots(selectedDoctor.id, dateStr);
      setBookedSlots(res.data);
    } catch {
      toast.error('Failed to load availability');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedDoctor) return;
    const clinicId = selectedClinic || selectedDoctor.clinics[0]?.id;
    if (!clinicId) {
      toast.error('Please select a clinic');
      return;
    }

    setBooking(true);
    try {
      await createAppointment({
        doctor_id: selectedDoctor.id,
        clinic_id: clinicId,
        appointment_date: selectedDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        notes: notes || null,
      });
      const clinicName = selectedDoctor.clinics.find(c => c.id === clinicId)?.name || '';
      setSuccess(`✓ Appointment confirmed for ${formatDate(selectedDate)} at ${selectedSlot.label} with ${selectedDoctor.full_name}${clinicName ? ` at ${clinicName}` : ''}`);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const availableDays = selectedDoctor?.schedules
    ?.filter(s => s.is_available)
    ?.map(s => s.day_of_week) || [];

  const currentStep = success ? 4 : selectedSlot ? 3 : selectedDate ? 3 : selectedDoctor ? 2 : 1;

  if (loading) {
    return (
      <PageWrapper title="Book Appointment">
        <SkeletonCard count={4} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Book Appointment">
      {/* Step indicator */}
      <div className="booking-steps">
        <div className={`booking-step ${currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'active') : ''}`}>
          <span className="booking-step-number">1</span>
          Choose Doctor
        </div>
        <div className="booking-step-divider" />
        <div className={`booking-step ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}`}>
          <span className="booking-step-number">2</span>
          Choose Date
        </div>
        <div className="booking-step-divider" />
        <div className={`booking-step ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}`}>
          <span className="booking-step-number">3</span>
          Choose Time
        </div>
      </div>

      {/* Step 1 — Doctor selection */}
      <div className="booking-section">
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            placeholder="Search doctors by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="search-doctors"
          />
        </div>

        {filteredDoctors.length ? (
          filteredDoctors.map(doc => (
            <div
              key={doc.id}
              className={`doctor-card ${selectedDoctor?.id === doc.id ? 'selected' : ''}`}
              onClick={() => handleSelectDoctor(doc)}
            >
              <div className="doctor-card-name">{doc.full_name}</div>
              <div className="doctor-card-clinic">
                {doc.clinics.map(c => c.name).join(', ') || 'No clinic listed'}
                {doc.clinics[0]?.address && ` · ${doc.clinics[0].address}`}
              </div>
              <div className="doctor-card-days">
                {[0, 1, 2, 3, 4, 5, 6].map(d => {
                  const isAvail = doc.schedules.some(s => s.day_of_week === d && s.is_available);
                  return (
                    <span key={d} className={`day-pill ${isAvail ? 'available' : ''}`}>
                      {getDayName(d)}
                    </span>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <EmptyState icon="🩺" title="No doctors found" message="Try a different search term." />
        )}
      </div>

      {/* Step 2 — Date selection */}
      {selectedDoctor && (
        <div className="booking-section" style={{ marginTop: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Select a date for {selectedDoctor.full_name}
          </h2>
          <div style={{ maxWidth: 360 }}>
            <MiniCalendar
              availableDays={[...new Set(availableDays)]}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </div>
        </div>
      )}

      {/* Step 3 — Slot selection */}
      {selectedDate && (
        <div className="booking-section" style={{ marginTop: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Available slots for {formatDate(selectedDate)}
          </h2>
          {loadingSlots ? (
            <SkeletonCard count={1} />
          ) : (
            <>
              <SlotPicker
                schedules={selectedDoctor.schedules}
                bookedSlots={bookedSlots}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />

              {selectedSlot && (
                <div style={{ marginTop: 20, maxWidth: 400 }}>
                  {selectedDoctor.clinics.length > 1 && (
                    <Input
                      label="Select Clinic"
                      type="select"
                      value={selectedClinic || ''}
                      onChange={e => setSelectedClinic(Number(e.target.value))}
                    >
                      <option value="">Choose a clinic...</option>
                      {selectedDoctor.clinics.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.address ? ` — ${c.address}` : ''}</option>
                      ))}
                    </Input>
                  )}
                  <Input
                    label="Reason for visit (optional)"
                    type="textarea"
                    placeholder="Brief description of your concern..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                  <Button variant="primary" loading={booking} onClick={handleBook} style={{ marginTop: 8 }}>
                    Confirm Appointment
                  </Button>
                </div>
              )}
            </>
          )}

          {success && (
            <div className="booking-success">{success}</div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
