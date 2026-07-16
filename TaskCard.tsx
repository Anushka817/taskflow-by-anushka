/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task } from '../types';
import { Calendar, AlertTriangle, CheckCircle2, Clock, Trash2, Edit2, AlertCircle, Paperclip, GripVertical, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  theme: 'dark' | 'light';
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onEdit, onDelete, theme }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isDark = theme === 'dark';

  // Define styling based on priority
  const priorityConfig = {
    high: {
      border: isDark ? 'border-rose-500/20 bg-rose-950/10 hover:border-rose-500/30' : 'border-rose-200 bg-rose-50 hover:border-rose-300',
      badge: isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-100 text-rose-800 border border-rose-200',
      indicator: 'bg-rose-500',
    },
    medium: {
      border: isDark ? 'border-amber-500/20 bg-amber-950/10 hover:border-amber-500/30' : 'border-amber-200 bg-amber-50 hover:border-amber-300',
      badge: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-100 text-amber-800 border border-amber-200',
      indicator: 'bg-amber-500',
    },
    low: {
      border: isDark ? 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/30' : 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
      badge: isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      indicator: 'bg-emerald-500',
    },
  };

  // Category visual labels
  const categoryConfig = {
    work: { label: 'Work', color: 'bg-indigo-500 text-indigo-500' },
    personal: { label: 'Personal', color: 'bg-cyan-500 text-cyan-500' },
    health: { label: 'Health', color: 'bg-rose-500 text-rose-500' },
    finance: { label: 'Finance', color: 'bg-amber-500 text-amber-500' },
    other: { label: 'Other', color: 'bg-purple-500 text-purple-500' },
  };

  const priority = task.priority || 'medium';
  const config = priorityConfig[priority];
  const isCompleted = task.status === 'completed';
  const cat = task.category || 'work';
  const catConfig = categoryConfig[cat];

  // Format date
  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = () => {
    if (isCompleted || !task.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual state class if needed
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={handleDragStart}
      className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-xl transition-all duration-300 group cursor-grab active:cursor-grabbing ${
        isCompleted
          ? isDark
            ? 'border-zinc-800 bg-zinc-900/20 opacity-50 hover:opacity-75'
            : 'border-zinc-200 bg-zinc-50/50 opacity-60 hover:opacity-85'
          : config.border
      } hover:shadow-md`}
      id={`task-card-${task.id}`}
    >
      {/* Priority Left accent */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isCompleted ? 'bg-zinc-400' : config.indicator}`} />

      <AnimatePresence mode="wait">
        {!isConfirmingDelete ? (
          <div className="flex flex-col gap-3 h-full">
            
            {/* Header Row: status toggle, Title and drag handle */}
            <div className="flex items-start gap-2.5">
              
              {/* Drag Handle */}
              <div className={`mt-1 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab`}>
                <GripVertical className="h-4 w-4 shrink-0" />
              </div>

              {/* Checkbox button */}
              <button
                onClick={() => onToggleStatus(task)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 cursor-pointer ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500'
                    : isDark
                    ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-transparent'
                    : 'border-zinc-300 hover:border-zinc-500 bg-white text-transparent'
                }`}
                aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4.5 w-4.5" />
                ) : (
                  <div className="h-2.5 w-2.5 rounded bg-zinc-400 opacity-0 hover:opacity-100 transition-opacity" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-bold leading-snug break-words transition-all duration-200 ${
                    isCompleted 
                      ? isDark ? 'text-zinc-500 line-through' : 'text-zinc-400 line-through'
                      : isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {task.title}
                </h4>

                {task.description && (
                  <p
                    className={`mt-1 text-xs leading-relaxed break-words line-clamp-2 ${
                      isCompleted 
                        ? 'text-zinc-500' 
                        : isDark ? 'text-zinc-400' : 'text-zinc-600'
                    }`}
                  >
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* Middle Row: Tags & Attachment */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {/* Priority badge */}
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                {priority}
              </span>

              {/* Category Tag */}
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                isDark ? 'bg-zinc-900 text-zinc-300 border border-white/5' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${catConfig.color}`} />
                <span>{catConfig.label}</span>
              </span>

              {/* Attachment Badge */}
              {task.attachment && (
                <a
                  href={task.attachment.dataUrl || '#'}
                  download={task.attachment.name}
                  onClick={(e) => {
                    if (!task.attachment?.dataUrl) e.preventDefault();
                  }}
                  className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 hover:underline cursor-pointer border ${
                    isDark ? 'bg-zinc-900 border-white/5 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}
                  title={`Download attachment: ${task.attachment.name} (${task.attachment.size})`}
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[70px] truncate">{task.attachment.name}</span>
                </a>
              )}
            </div>

            {/* Bottom Row: Date indicators and Action button triggers */}
            <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 ${
              isDark ? 'border-white/5' : 'border-zinc-200'
            }`}>
              {/* Due Date Info */}
              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  isOverdue()
                    ? 'text-rose-500'
                    : isCompleted
                    ? 'text-zinc-500'
                    : isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {isOverdue() ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                )}
                <span className="text-[11px]">{formatDueDate(task.dueDate)}</span>
                {isOverdue() && <span className="text-[9px] uppercase font-bold text-rose-600">(Overdue)</span>}
              </span>

              {/* Action Operations */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(task)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isDark 
                      ? 'border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' 
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Modify details"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isDark 
                      ? 'border-white/5 bg-zinc-900/60 hover:bg-rose-950/20 text-zinc-400 hover:text-rose-400' 
                      : 'border-zinc-200 bg-zinc-50 hover:bg-rose-50 text-zinc-500 hover:text-rose-600'
                  }`}
                  title="Remove task"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* Inline Glassmorphic Confirmation Takeover Overlay */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 rounded-xl backdrop-blur-xl ${
              isDark ? 'bg-zinc-950/95 border border-rose-500/20' : 'bg-white/95 border border-rose-200'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-2">
              <AlertCircle className="h-5 w-5 animate-bounce" />
            </div>
            <p className={`text-xs font-black px-2 leading-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Delete this task?
            </p>
            <p className="text-[10px] text-zinc-500 mt-1 px-4 truncate max-w-full font-medium">
              "{task.title}"
            </p>
            <div className="flex gap-2 mt-4 w-full justify-center px-4">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                  isDark 
                    ? 'border-white/5 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' 
                    : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(task.id);
                  setIsConfirmingDelete(false);
                }}
                className="flex-1 py-2 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
