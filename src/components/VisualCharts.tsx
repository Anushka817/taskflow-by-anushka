/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TaskStats } from '../types';
import { motion } from 'motion/react';
import { PieChart, BarChart2, CheckCircle2, TrendingUp, Sparkles, FolderKanban } from 'lucide-react';

interface VisualChartsProps {
  stats: TaskStats;
  theme: 'dark' | 'light';
}

export const VisualCharts: React.FC<VisualChartsProps> = ({ stats, theme }) => {
  const isDark = theme === 'dark';

  // Calculations for custom SVG Pie Chart representing Task Priority Density
  const totalPriorities = stats.highPriorityCount + stats.mediumPriorityCount + stats.lowPriorityCount;
  
  // Custom SVG Pie segments calculation
  const getPieSegments = () => {
    if (totalPriorities === 0) return [];
    const segments = [
      { key: 'high', label: 'High', value: stats.highPriorityCount, color: '#f43f5e' }, // rose-500
      { key: 'medium', label: 'Medium', value: stats.mediumPriorityCount, color: '#f59e0b' }, // amber-500
      { key: 'low', label: 'Low', value: stats.lowPriorityCount, color: '#10b981' }, // emerald-500
    ];

    let accumulatedAngle = 0;
    return segments.map((seg) => {
      const percentage = (seg.value / totalPriorities) * 100;
      const angle = (seg.value / totalPriorities) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      // Calculate path coordinates for arc (radius = 50, center = 60,60)
      const radStart = ((startAngle - 90) * Math.PI) / 180;
      const radEnd = (((startAngle + angle) - 90) * Math.PI) / 180;

      const x1 = 60 + 50 * Math.cos(radStart);
      const y1 = 60 + 50 * Math.sin(radStart);
      const x2 = 60 + 50 * Math.cos(radEnd);
      const y2 = 60 + 50 * Math.sin(radEnd);

      const largeArc = angle > 180 ? 1 : 0;
      const d = angle === 360 
        ? `M 60,10 A 50,50 0 1,1 59.9,10 Z`
        : `M 60,60 L ${x1},${y1} A 50,50 0 ${largeArc},1 ${x2},${y2} Z`;

      return { ...seg, d, percentage };
    });
  };

  const segments = getPieSegments();

  // Find max category count for scale
  const categories = [
    { label: 'Work', key: 'work', count: stats.categoryDistribution.work, color: '#6366f1' },
    { label: 'Personal', key: 'personal', count: stats.categoryDistribution.personal, color: '#06b6d4' },
    { label: 'Health', key: 'health', count: stats.categoryDistribution.health, color: '#ec4899' },
    { label: 'Finance', key: 'finance', count: stats.categoryDistribution.finance, color: '#f59e0b' },
    { label: 'Other', key: 'other', count: stats.categoryDistribution.other, color: '#8b5cf6' },
  ];
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* priority composition (pie chart representation) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`rounded-2xl border ${
          isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/70'
        } p-6 backdrop-blur-xl flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-sm font-bold flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <PieChart className="h-4 w-4 text-rose-500" />
              <span>Priority Breakdown</span>
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-full ${isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
              Density metrics
            </span>
          </div>

          {totalPriorities > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
              {/* Pie SVG */}
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full transform hover:scale-105 transition-transform duration-300">
                  {segments.map((seg) => (
                    <motion.path
                      key={seg.key}
                      d={seg.d}
                      fill={seg.color}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                      className="cursor-pointer"
                      title={`${seg.label}: ${seg.value} tasks (${Math.round(seg.percentage)}%)`}
                    />
                  ))}
                  {/* Inner cutout for donut style */}
                  <circle cx="60" cy="60" r="30" fill={isDark ? '#09090b' : '#ffffff'} />
                </svg>
                {/* Center visual label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-xl font-black ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{totalPriorities}</span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Tasks</span>
                </div>
              </div>

              {/* Legend & Details */}
              <div className="flex-1 space-y-3 w-full">
                {segments.map((seg) => (
                  <div key={seg.key} className="flex items-center justify-between p-2 rounded-xl bg-black/5 hover:bg-black/10 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{seg.label} Priority</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{seg.value}</span>
                      <span className="text-zinc-500 text-[10px]">({Math.round(seg.percentage)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
              <Sparkles className="h-8 w-8 mb-2 opacity-30 text-rose-500" />
              <p className="text-xs">No tasks mapped with priorities yet.</p>
            </div>
          )}
        </div>

        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-zinc-200'} text-[11px] text-zinc-500 flex justify-between`}>
          <span>Real-time DB synchronization</span>
          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-500" /> +0.0% variance</span>
        </div>
      </motion.div>

      {/* category distribution (bar chart representation) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`rounded-2xl border ${
          isDark ? 'border-white/5 bg-zinc-900/10' : 'border-zinc-200 bg-white/70'
         } p-6 backdrop-blur-xl flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-sm font-bold flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <BarChart2 className="h-4 w-4 text-indigo-500" />
              <span>Category Mix</span>
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-full ${isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
              Functional tags
            </span>
          </div>

          <div className="space-y-4 py-2">
            {categories.map((cat) => {
              const pct = (cat.count / maxCategoryCount) * 100;
              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-2 font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </span>
                    <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
                      {cat.count} {cat.count === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  {/* Progress Bar with Motion */}
                  <div className={`h-2.5 w-full rounded-full ${isDark ? 'bg-zinc-950/40' : 'bg-zinc-100'} overflow-hidden`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-zinc-200'} text-[11px] text-zinc-500 flex justify-between`}>
          <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Categorization analytics</span>
          <span>Max focus: {categories.find(c => c.count === Math.max(...categories.map(e => e.count)))?.label || 'None'}</span>
        </div>
      </motion.div>

    </div>
  );
};
