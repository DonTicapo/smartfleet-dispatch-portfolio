import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../api/client';
import type { Message } from '../types';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnread() {
      try {
        const msgs = await apiFetch<Message[]>('/portal/messages');
        if (!cancelled) {
          setUnreadCount(msgs.filter((m) => !m.isRead).length);
        }
      } catch {
        // Silently ignore -- will retry on next interval
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-sf-orange-light text-sf-orange'
        : 'text-sf-text-500 hover:bg-slate-100 hover:text-sf-text-900'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header bar */}
      <header className="bg-white border-b border-sf-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / brand */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 -ml-2 rounded-md text-sf-text-500 hover:text-sf-text-700 hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-bold leading-tight">
                    <span className="text-sf-navy">SMART</span>
                    <span className="text-sf-orange">FLEET</span>
                  </span>
                  <span className="text-[10px] font-medium text-sf-text-500 tracking-wider uppercase">Customer Portal</span>
                </div>
                <div className="sm:hidden flex items-center">
                  <span className="text-lg font-bold">
                    <span className="text-sf-navy">S</span>
                    <span className="text-sf-orange">F</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Orders
              </NavLink>
              <NavLink to="/messages" className={navLinkClass}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Messages
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </nav>

            {/* User + logout */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-sf-text-500 hidden sm:inline">
                {user?.companyName ?? user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-sf-text-500 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-sf-border px-4 py-2 space-y-1">
          <NavLink
            to="/"
            end
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Orders
          </NavLink>
          <NavLink
            to="/messages"
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Messages
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-sf-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-sf-text-500">
          SmartFleet Dispatch &mdash; Customer Visibility Portal
        </div>
      </footer>
    </div>
  );
}

// Prevent unused import warning
void React;
