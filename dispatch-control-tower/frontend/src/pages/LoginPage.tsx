import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Login page for the Dispatch Control Tower.
 *
 * The DCT backend does not expose its own /auth/login endpoint -- it expects
 * a pre-signed JWT from an external identity provider or gateway.  For the
 * portfolio demo we mint a short-lived JWT on the client side so the rest of
 * the UI can be exercised end-to-end without standing up an identity server.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  /** Create a demo JWT (HS256-shaped, unsigned -- fine for frontend demo). */
  function createDemoToken(userEmail: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: 'demo-dispatcher',
      role: 'dispatcher',
      email: userEmail,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 hours
    };
    const encode = (obj: object) =>
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `${encode(header)}.${encode(payload)}.demo-signature`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate a small network delay for realism
      await new Promise((r) => setTimeout(r, 400));

      if (!email || !password) {
        throw new Error('Please enter email and password.');
      }

      const token = createDemoToken(email);
      login(token);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sf-navy to-[#1a2340] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold">
            <span className="text-white">SMART</span>
            <span className="text-sf-orange">FLEET</span>
          </h1>
          <p className="text-white/60 mt-1">Dispatch Control Tower</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-up delay-1">
          <h2 className="text-lg font-semibold text-sf-text-900 mb-6">
            Sign in to dispatch
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
                placeholder="dispatcher@smartfleet.com"
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
              className="w-full rounded-full bg-gradient-to-r from-sf-orange to-sf-orange-hover px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(214,81,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(214,81,42,0.4)] focus:outline-none focus:ring-2 focus:ring-sf-orange/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-sf-text-300">
            Demo: use any email/password to sign in
          </p>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 animate-fade-up delay-2">
          SmartFleet Dispatch &mdash; Control Tower
        </p>
      </div>
    </div>
  );
}
