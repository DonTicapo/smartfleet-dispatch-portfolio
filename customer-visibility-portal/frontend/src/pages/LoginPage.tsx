import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../api/client';
import type { LoginResponse } from '../types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>('/portal/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sf-bg-gray to-slate-100 px-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-up delay-1">
          <h1 className="text-4xl font-bold leading-tight">
            <span className="text-sf-navy">SMART</span>
            <span className="bg-gradient-to-r from-sf-orange to-sf-orange-hover bg-clip-text text-transparent">FLEET</span>
          </h1>
          <p className="text-sf-text-500 mt-1 text-sm font-medium tracking-wide uppercase">Customer Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-sf-border p-8 animate-fade-up delay-2">
          <h2 className="text-lg font-semibold text-sf-text-900 mb-6">
            Sign in to your account
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-sf-text-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sf-text-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-br from-sf-orange to-sf-orange-hover px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(214,81,42,0.3)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sf-orange/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-sf-text-500 mt-6 animate-fade-up delay-3">
          SmartFleet Dispatch &mdash; Customer Visibility Portal
        </p>
      </div>
    </div>
  );
}
