import { useEffect, useMemo, useRef, useState } from 'react';
import './GlassDatePicker.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDisplayDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return date.getFullYear() === Number(match[3]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[1]) ? date : null;
}

function formatDisplayDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export default function GlassDatePicker({ value, onChange, placeholder = 'DD/MM/YYYY', required = false, id, ariaLabel, labelledBy, minDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const today = useMemo(() => new Date(), []);
  const minimum = useMemo(() => parseDisplayDate(minDate), [minDate]);
  const [viewDate, setViewDate] = useState(() => parseDisplayDate(value) || new Date());

  useEffect(() => {
    const selected = parseDisplayDate(value);
    if (selected) setViewDate(selected);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDate = parseDisplayDate(value);

  const selectDay = (day, event) => {
    event.stopPropagation();
    const selection = new Date(year, month, day);
    if (minimum && selection < minimum) return;
    onChange(formatDisplayDate(selection));
    setIsOpen(false);
  };

  const isSameDay = (left, right) => left && right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

  return (
    <div className="glass-datepicker-wrap" ref={containerRef} onClick={(event) => event.stopPropagation()}>
      <button
        id={id}
        type="button"
        className={`glass-datepicker-input-box ${isOpen ? 'is-focused' : ''}`}
        aria-label={labelledBy ? undefined : ariaLabel || placeholder}
        aria-labelledby={labelledBy}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className={value ? 'input-val' : 'input-placeholder'}>{value || placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="calendar-toggle-icon" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {required && <input className="glass-datepicker-required-input" type="text" value={value} required readOnly tabIndex={-1} aria-hidden="true" />}

      {isOpen && (
        <div className="glass-calendar-dropdown" role="dialog" aria-label="Choose a date" onClick={(event) => event.stopPropagation()}>
          <div className="cal-header">
            <span className="cal-title">{MONTH_NAMES[month]} {year}</span>
            <div className="cal-nav-buttons">
              <button type="button" className="cal-nav-btn" onClick={(event) => { event.stopPropagation(); setViewDate(new Date(year, month - 1, 1)); }} aria-label="Previous month">‹</button>
              <button type="button" className="cal-nav-btn" onClick={(event) => { event.stopPropagation(); setViewDate(new Date(year, month + 1, 1)); }} aria-label="Next month">›</button>
            </div>
          </div>
          <div className="cal-weekdays">{DAYS_OF_WEEK.map((day) => <span key={day} className="cal-weekday">{day}</span>)}</div>
          <div className="cal-days-grid">
            {Array.from({ length: firstDayIndex }).map((_, index) => <span key={`previous-${index}`} className="cal-day prev-month-day" aria-hidden="true" />)}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const disabled = Boolean(minimum && date < minimum);
              return <button key={day} type="button" className={`cal-day active-month-day ${isSameDay(selectedDate, date) ? 'selected' : ''} ${isSameDay(today, date) ? 'today-ring' : ''}`} onClick={(event) => selectDay(day, event)} disabled={disabled}>{day}</button>;
            })}
          </div>
          <div className="cal-footer">
            <button type="button" className="cal-action-btn" onClick={(event) => { event.stopPropagation(); onChange(''); setIsOpen(false); }}>Clear</button>
            <button type="button" className="cal-action-btn today-highlight" onClick={(event) => { event.stopPropagation(); if (!minimum || today >= minimum) { setViewDate(today); onChange(formatDisplayDate(today)); } setIsOpen(false); }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
