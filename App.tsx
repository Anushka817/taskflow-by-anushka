/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import { api } from './lib/api';
import { AuthLayout } from './components/AuthLayout';
import { Dashboard } from './components/Dashboard';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Theme state: default to 'dark' or loaded preference
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const handleThemeToggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // Toast notifier trigger helper
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync token from localStorage on boot
  useEffect(() => {
    const storedToken = localStorage.getItem('task_manager_token');
    const storedUser = localStorage.getItem('task_manager_user');

    const verifyToken = async () => {
      if (storedToken) {
        try {
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          const response = await api.getCurrentUser();
          setUser(response.user);
          localStorage.setItem('task_manager_user', JSON.stringify(response.user));
        } catch (error) {
          localStorage.removeItem('task_manager_token');
          localStorage.removeItem('task_manager_user');
          setToken(null);
          setUser(null);
          showToast('Session has expired. Please sign in again.', 'info');
        }
      }
      setInitializing(false);
    };

    verifyToken();
  }, [showToast]);

  const handleLoginSuccess = (newToken: string, authenticatedUser: User) => {
    localStorage.setItem('task_manager_token', newToken);
    localStorage.setItem('task_manager_user', JSON.stringify(authenticatedUser));
    setToken(newToken);
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('task_manager_token');
      localStorage.removeItem('task_manager_user');
      setToken(null);
      setUser(null);
      showToast('Successfully logged out of workspace', 'info');
    }
  };

  if (initializing) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-zinc-950 text-zinc-400' : 'bg-slate-50 text-zinc-600'
      }`}>
        <Loader2 className="h-9 w-9 text-indigo-500 animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Initializing TaskFlow Workspace...</p>
      </div>
    );
  }

  return (
    <>
      {token && user ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onShowToast={showToast} 
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
      ) : (
        <AuthLayout 
          onLoginSuccess={handleLoginSuccess} 
          onShowToast={showToast} 
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
      )}

      {/* Global Toast Layer */}
      <ToastContainer toasts={toasts} onRemove={handleDismissToast} />
    </>
  );
}
