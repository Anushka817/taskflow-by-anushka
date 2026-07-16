/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TaskStats } from '../types';
import { CheckCircle2, Clock, ListTodo, AlertCircle, PlayCircle, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsSectionProps {
  stats: TaskStats;
  theme: 'dark' | 'light';
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, theme }) => {
  const isDark = theme === 'dark';

  // SVG Circular progress properties
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="space-y-6 mb-8">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Tasks Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl ${
            isDark 
              ? 'border-white/5 bg-zinc-900/10' 
              : 'border-zinc-200 bg-white/70'
          }`}
          id="stat-card-total"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Tasks</p>
              <h3 className={`mt-2 text-3xl font-black ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{stats.totalTasks}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <ListTodo className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: '100%' }} />
            </div>
          </div>
        </motion.div>

        {/* Completed Tasks Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl ${
            isDark 
              ? 'border-white/5 bg-zinc-900/10' 
              : 'border-zinc-200 bg-white/70'
          }`}
          id="stat-card-completed"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Completed</p>
              <div className="flex items-baseline gap-2">
                <h3 className={`mt-2 text-3xl font-black ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{stats.completedTasks}</h3>
                <span className="text-xs font-extrabold text-emerald-500">({stats.completionRate}%)</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.completionRate}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
          </div>
        </motion.div>

        {/* In Progress Tasks Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl ${
            isDark 
              ? 'border-white/5 bg-zinc-900/10' 
              : 'border-zinc-200 bg-white/70'
          }`}
          id="stat-card-in-progress"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-blue-500/5 blur-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">In Progress</p>
              <h3 className={`mt-2 text-3xl font-black ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{stats.inProgressTasks}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <PlayCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-1.5 rounded-full bg-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Overdue Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-colors ${
            stats.overdueCount > 0
              ? isDark
                ? 'border-rose-500/20 bg-rose-950/10 text-rose-300'
                : 'border-rose-200 bg-rose-50 text-rose-800'
              : isDark
              ? 'border-white/5 bg-zinc-900/10'
              : 'border-zinc-200 bg-white/70'
          }`}
          id="stat-card-overdue"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-rose-500/5 blur-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Overdue</p>
              <h3 className={`mt-2 text-3xl font-black ${stats.overdueCount > 0 ? 'text-rose-500' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {stats.overdueCount}
              </h3>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              stats.overdueCount > 0 ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-zinc-800/10 text-zinc-400'
            }`}>
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] text-zinc-500 font-semibold truncate">
              {stats.overdueCount > 0 ? 'Action items require updates' : 'All targets on schedule'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Circular Gauge and breakdown bar charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`overflow-hidden rounded-2xl border p-6 backdrop-blur-xl ${
          isDark 
            ? 'border-white/5 bg-zinc-900/10' 
            : 'border-zinc-200 bg-white/70'
        }`}
        id="stats-priority-breakdown"
      >
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Overall Target Achievement
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Circular Completion Ring */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
            <div className="relative flex items-center justify-center w-36 h-36">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className={isDark ? 'stroke-zinc-800' : 'stroke-zinc-200'}
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-emerald-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-black ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{stats.completionRate}%</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-0.5">
                  <Award className="h-3 w-3 text-emerald-500" /> Done
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 text-center font-medium">
              Overall status completion rate
            </p>
          </div>

          {/* Priority Levels Stacked Distribution */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Operational Densities</span>
              <span>Prioritization tiers</span>
            </div>

            <div className="space-y-3">
              {/* High Priority */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`flex items-center gap-2 font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    High Priority
                  </span>
                  <span className="font-extrabold text-rose-500">{stats.highPriorityCount} tasks</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalTasks > 0 ? (stats.highPriorityCount / stats.totalTasks) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-rose-500"
                  />
                </div>
              </div>

              {/* Medium Priority */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`flex items-center gap-2 font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Medium Priority
                  </span>
                  <span className="font-extrabold text-amber-500">{stats.mediumPriorityCount} tasks</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalTasks > 0 ? (stats.mediumPriorityCount / stats.totalTasks) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-amber-500"
                  />
                </div>
              </div>

              {/* Low Priority */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`flex items-center gap-2 font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Low Priority
                  </span>
                  <span className="font-extrabold text-emerald-500">{stats.lowPriorityCount} tasks</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalTasks > 0 ? (stats.lowPriorityCount / stats.totalTasks) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
