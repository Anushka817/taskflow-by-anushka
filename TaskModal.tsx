/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskPriority, TaskStatus, TaskCategory, TaskAttachment } from '../types';
import { X, Calendar, AlertOctagon, HelpCircle, Paperclip, Check, File, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    attachment?: TaskAttachment;
  }) => void;
  taskToEdit?: Task | null;
  theme: 'dark' | 'light';
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, taskToEdit, theme }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [attachment, setAttachment] = useState<TaskAttachment | undefined>(undefined);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setDueDate(taskToEdit.dueDate);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setCategory(taskToEdit.category || 'work');
      setAttachment(taskToEdit.attachment);
    } else {
      setTitle('');
      setDescription('');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setPriority('medium');
      setStatus('pending');
      setCategory('work');
      setAttachment(undefined);
    }
    setError('');
  }, [taskToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        name: file.name,
        size: sizeStr,
        dataUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      status,
      category,
      attachment,
    });
    onClose();
  };

  const categoryOptions: { value: TaskCategory; label: string; color: string }[] = [
    { value: 'work', label: 'Work', color: 'bg-indigo-500' },
    { value: 'personal', label: 'Personal', color: 'bg-cyan-500' },
    { value: 'health', label: 'Health', color: 'bg-rose-500' },
    { value: 'finance', label: 'Finance', color: 'bg-amber-500' },
    { value: 'other', label: 'Other', color: 'bg-purple-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-lg overflow-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-md my-8 ${
              isDark 
                ? 'border-white/10 bg-zinc-950 text-zinc-100' 
                : 'border-zinc-200 bg-white text-zinc-900'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {taskToEdit ? 'Modify Task Details' : 'Design New Task'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Deliver production builds"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    isDark 
                      ? 'border-white/5 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500' 
                      : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                  }`}
                  maxLength={100}
                  required
                />
              </div>

              {/* Task Description */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide supplementary details or notes..."
                  rows={3}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none ${
                    isDark 
                      ? 'border-white/5 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500' 
                      : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                  }`}
                  maxLength={500}
                />
              </div>

              {/* Category selector pills */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Category Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categoryOptions.map((opt) => {
                    const isSelected = category === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : isDark
                            ? 'bg-zinc-900/40 border-transparent hover:border-zinc-800 text-zinc-400'
                            : 'bg-zinc-100 border-transparent hover:border-zinc-200 text-zinc-600'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                        <span>{opt.label}</span>
                        {isSelected && <Check className="h-3 w-3 shrink-0 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Row: Due Date and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        isDark 
                          ? 'border-white/5 bg-zinc-900/50 text-zinc-100' 
                          : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer ${
                      isDark 
                        ? 'border-white/5 bg-zinc-900/50 text-zinc-100' 
                        : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                    }`}
                  >
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Task Pipeline Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      status === 'pending'
                        ? isDark
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                        : isDark
                        ? 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900/80'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    ⏳ Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('in_progress')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      status === 'in_progress'
                        ? isDark
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-blue-50 border-blue-200 text-blue-700'
                        : isDark
                        ? 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900/80'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    🚀 In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('completed')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      status === 'completed'
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : isDark
                        ? 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900/80'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    ✅ Completed
                  </button>
                </div>
              </div>

              {/* File Attachment Support */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  File Attachment
                </label>
                {attachment ? (
                  <div className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-zinc-900/50 border-white/5 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      <File className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold truncate">{attachment.name}</span>
                      <span className="text-[10px] text-zinc-500">({attachment.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed text-xs font-semibold cursor-pointer transition-all hover:bg-indigo-500/5 ${
                        isDark 
                          ? 'border-white/10 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200' 
                          : 'border-zinc-300 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Paperclip className="h-4 w-4 text-zinc-500" />
                      <span>Upload supplemental file (document, logs, or image)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer border ${
                    isDark
                      ? 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border-white/5'
                      : 'text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border-zinc-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  {taskToEdit ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
