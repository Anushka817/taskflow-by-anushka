/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  theme: 'dark' | 'light';
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick, theme }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get first day of current month (0-6)
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray = [];

  // Previous month padding days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month padding days
  const totalSlots = 42; // 6 rows of 7 days
  const nextMonthPadding = totalSlots - daysArray.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  // Helper to get ISO string for a date (YYYY-MM-DD)
  const getLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Filter tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dStr = getLocalDateStr(date);
    return tasks.filter((t) => t.dueDate === dStr);
  };

  const selectedDateTasks = selectedDateStr
    ? tasks.filter((t) => t.dueDate === selectedDateStr)
    : [];

  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl border ${isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/70'} p-6 backdrop-blur-xl mb-8`}>
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Interactive Calendar Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
              <CalendarIcon className="h-4 w-4 text-indigo-500" />
              <span>{monthNames[month]} {year}</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-white/5 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-white/5 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold tracking-wider text-zinc-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((slot, index) => {
              const dStr = getLocalDateStr(slot.date);
              const dayTasks = getTasksForDate(slot.date);
              const isSelected = selectedDateStr === dStr;
              const isToday = getLocalDateStr(new Date()) === dStr;

              // Priority indicator dots
              const hasHigh = dayTasks.some((t) => t.priority === 'high' && t.status !== 'completed');
              const hasMedium = dayTasks.some((t) => t.priority === 'medium' && t.status !== 'completed');
              const hasLow = dayTasks.some((t) => t.priority === 'low' && t.status !== 'completed');
              const hasCompleted = dayTasks.length > 0 && dayTasks.every((t) => t.status === 'completed');

              return (
                <button
                  key={`${slot.date.getTime()}-${index}`}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`min-h-[64px] p-1.5 rounded-xl border flex flex-col justify-between items-stretch text-left transition-all relative cursor-pointer group ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500'
                      : isDark
                      ? 'border-transparent hover:border-zinc-800'
                      : 'border-transparent hover:border-zinc-200'
                  } ${
                    slot.isCurrentMonth
                      ? isDark
                        ? 'bg-zinc-950/40'
                        : 'bg-zinc-50/70'
                      : 'opacity-30'
                  }`}
                >
                  {/* Day Number */}
                  <span className={`text-xs font-bold leading-none self-end ${
                    isToday
                      ? 'h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold shadow-sm'
                      : isDark
                      ? 'text-zinc-400 group-hover:text-zinc-100'
                      : 'text-zinc-600 group-hover:text-zinc-900'
                  }`}>
                    {slot.day}
                  </span>

                  {/* Dot/Badge Indicators */}
                  <div className="mt-auto flex flex-wrap gap-0.5 justify-center min-h-[8px]">
                    {hasHigh && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" title="Uncompleted High priority tasks" />}
                    {hasMedium && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Uncompleted Medium priority tasks" />}
                    {hasLow && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Uncompleted Low priority tasks" />}
                    {hasCompleted && <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" title="All tasks completed" />}
                  </div>

                  {/* Hover count detail overlay on desktop */}
                  {dayTasks.length > 0 && (
                    <span className="absolute left-1.5 top-1.5 text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 scale-0 group-hover:scale-100 transition-transform origin-top-left">
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Chosen Day's Task Specifications */}
        <div className={`w-full md:w-80 rounded-xl p-5 ${isDark ? 'bg-zinc-950/60 border border-white/5' : 'bg-zinc-100/60 border border-zinc-200'} flex flex-col justify-between`}>
          <div>
            <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {selectedDateStr ? (
                <span>Schedule: {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              ) : (
                <span>Choose a date</span>
              )}
            </h4>

            {selectedDateStr ? (
              selectedDateTasks.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                        task.status === 'completed'
                          ? isDark
                            ? 'bg-zinc-900/30 border-zinc-900 opacity-60 text-zinc-500'
                            : 'bg-zinc-200/50 border-zinc-200 opacity-60 text-zinc-500'
                          : task.priority === 'high'
                          ? isDark
                            ? 'bg-rose-950/10 border-rose-500/20 text-rose-300 hover:border-rose-500/30'
                            : 'bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-300'
                          : task.priority === 'medium'
                          ? isDark
                            ? 'bg-amber-950/10 border-amber-500/20 text-amber-300 hover:border-amber-500/30'
                            : 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-300'
                          : isDark
                          ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300 hover:border-emerald-500/30'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {task.status === 'completed' ? (
                          <CheckSquare className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        ) : (
                          <Clock className={`h-3.5 w-3.5 shrink-0 ${task.priority === 'high' ? 'text-rose-400' : 'text-zinc-400'}`} />
                        )}
                        <span className="text-xs font-bold truncate flex-1">{task.title}</span>
                      </div>
                      {task.description && (
                        <p className={`text-[10px] mt-1 truncate ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 flex flex-col items-center justify-center">
                  <CheckSquare className="h-8 w-8 mb-2 opacity-30 text-zinc-400" />
                  <p className="text-xs">No tasks scheduled for this day</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center">
                <CalendarIcon className="h-8 w-8 mb-2 opacity-30 text-indigo-500" />
                <p className="text-xs">Select any day on the calendar grid to view or inspect due tasks.</p>
              </div>
            )}
          </div>

          {selectedDateStr && selectedDateTasks.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-zinc-200'} flex items-center justify-between text-xs text-zinc-500`}>
              <span>Total tasks: {selectedDateTasks.length}</span>
              <span>Pending: {selectedDateTasks.filter(t => t.status !== 'completed').length}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
