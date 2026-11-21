/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import { LogOut, CheckSquare, PlusCircle, Sun, Moon, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onOpenNewTaskModal: () => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onOpenNewTaskModal, theme, onThemeToggle }) => {
  const isDark = theme === 'dark';

  // Get user's initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(/[\s_-]+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate a distinct gradient based on username string
  const getAvatarGradient = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-pink-500 to-rose-600',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-cyan-400 to-blue-500',
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDark 
          ? 'border-white/5 bg-zinc-950/80 text-zinc-100' 
          : 'border-zinc-200 bg-white/80 text-zinc-900'
      }`}
      id="app-navbar"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand/Logo Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20 text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className={`text-base font-black tracking-tight hidden sm:block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              TaskFlow<span className="text-indigo-500">.</span>
            </span>
          </div>

          {/* Right Action Panel */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            
            {/* Create Task Shortcut */}
            <button
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden xs:inline">New Task</span>
            </button>

            {/* Light/Dark Toggle */}
            <button
              onClick={onThemeToggle}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'border-white/5 hover:bg-zinc-900 text-zinc-400 hover:text-white' 
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>

            {/* Profile Info & Logout */}
            <div className={`flex items-center gap-3 border-l pl-4 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
              
              {/* User Identity Display */}
              <div className="flex items-center gap-2.5" title={`Logged in as ${user.email}`}>
                {/* Premium Gradient Avatar */}
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${getAvatarGradient(user.username)} shadow-sm text-[11px] font-extrabold text-white`}>
                  {getInitials(user.username)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className={`text-xs font-bold leading-none ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    {user.username}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[100px]">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'border-transparent hover:border-rose-500/10 hover:bg-rose-950/20 text-zinc-400 hover:text-rose-400' 
                    : 'border-transparent hover:border-rose-200 hover:bg-rose-50 text-zinc-500 hover:text-rose-600'
                }`}
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </motion.header>
  );
};
