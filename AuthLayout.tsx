/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthLayoutProps {
  onLoginSuccess: (token: string, user: User) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ onLoginSuccess, onShowToast, theme, onThemeToggle }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      onShowToast('Please fill out all required fields', 'error');
      return;
    }

    if (!isLogin && !username.trim()) {
      onShowToast('Please choose a username', 'error');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      onShowToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await api.login(email.trim(), password);
        onShowToast('Welcome back! Loading your workspace...', 'success');
        onLoginSuccess(data.token, data.user);
      } else {
        const data = await api.register(username.trim(), email.trim(), password);
        onShowToast('Account successfully created! Welcome aboard!', 'success');
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'
    }`}>
      {/* Background Orbs */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
        isDark ? 'bg-indigo-600' : 'bg-indigo-400'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
        isDark ? 'bg-emerald-600' : 'bg-emerald-400'
      }`} />

      {/* Theme toggle floating at top right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={onThemeToggle}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isDark 
              ? 'border-white/5 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white' 
              : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Identity */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 shadow-xl shadow-indigo-500/20 mb-4 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            TaskFlow Workspace
          </h2>
          <p className="mt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {isLogin ? 'Sign in to access your operational queue' : 'Provision your team accounts'}
          </p>
        </div>

        {/* Form Container */}
        <div className={`rounded-2xl border p-8 backdrop-blur-xl shadow-2xl transition-all ${
          isDark 
            ? 'border-white/5 bg-zinc-900/10' 
            : 'border-zinc-200 bg-white/70'
        }`}>
          {/* Tabs */}
          <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl mb-6 ${
            isDark ? 'bg-zinc-950/60' : 'bg-zinc-100'
          }`}>
            <button
              onClick={() => setIsLogin(true)}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                isLogin 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                !isLogin 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {/* Username Input (Only on Register) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  key="username-input"
                >
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. workspace_pilot"
                      required
                      className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        isDark 
                          ? 'border-white/5 bg-zinc-950/40 text-zinc-100 placeholder-zinc-700' 
                          : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    isDark 
                      ? 'border-white/5 bg-zinc-950/40 text-zinc-100 placeholder-zinc-700' 
                      : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    isDark 
                      ? 'border-white/5 bg-zinc-950/40 text-zinc-100 placeholder-zinc-700' 
                      : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {/* Confirm Password Input (Only on Signup) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  key="confirm-password-input"
                >
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        isDark 
                          ? 'border-white/5 bg-zinc-950/40 text-zinc-100 placeholder-zinc-700' 
                          : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Workspace' : 'Initialize Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
