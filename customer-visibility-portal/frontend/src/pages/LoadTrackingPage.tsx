import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import LoadProgress from '../components/LoadProgress';
import StatusBadge from '../components/StatusBadge';
import type { Load } from '../types';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'polling';

export default function LoadTrackingPage() {
  const { loadId } = useParams<{ loadId: string }>();
  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connState, setConnState] = useState<ConnectionState>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCount = useRef(0);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Fallback HTTP polling
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    setConnState('polling');

    const poll = async () => {
      try {
        const data = await apiFetch<Load>(`/portal/loads/${loadId}`);
        setLoad(data);
        setError('');
        setLoading(false);
        if (data.status === 'COMPLETED' && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 15000);
  }, [loadId]);

  // WebSocket connection
  const connectWs = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !loadId) {
      startPolling();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '3003'; // Backend port
    const wsUrl = `${protocol}//${host}:${port}/ws/loads/${loadId}?token=${encodeURIComponent(token)}`;

    setConnState(retryCount.current > 0 ? 'reconnecting' : 'connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnState('connected');
      retryCount.current = 0;
      // If we were polling, stop
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'load_update' && msg.data) {
          setLoad(msg.data);
          setError('');
          setLoading(false);
        } else if (msg.type === 'tracking_complete') {
          // Load is done, no more updates coming
        } else if (msg.type === 'error') {
          setError(msg.message || 'Server error');
          setLoading(false);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      if (event.code === 4001) {
        // Auth failure — don't retry, fall back to polling
        startPolling();
        return;
      }
      // Auto-reconnect with backoff (max 3 attempts, then fallback to polling)
      if (retryCount.current < 3) {
        retryCount.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 8000);
        setConnState('reconnecting');
        setTimeout(connectWs, delay);
      } else {
        startPolling();
      }
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }, [loadId, startPolling]);

  useEffect(() => {
    connectWs();
    return cleanup;
  }, [connectWs, cleanup]);

  // Keep-alive ping every 30s
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    return () => clearInterval(pingInterval);
  }, []);

  function formatTimestamp(ts: string | null): string {
    if (!ts) return '--';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const connectionIndicator = () => {
    const states: Record<ConnectionState, { color: string; label: string }> = {
      connecting: { color: 'bg-yellow-500', label: 'Connecting...' },
      connected: { color: 'bg-green-500', label: 'Live (WebSocket)' },
      reconnecting: { color: 'bg-yellow-500', label: 'Reconnecting...' },
      polling: { color: 'bg-sf-orange', label: 'Live (polling)' },
    };
    const s = states[connState];
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="relative flex h-2 w-2">
          {connState === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${s.color}`} />
        </span>
        {s.label}
        {connState === 'connected' && ' — updates every 5s'}
        {connState === 'polling' && ' — updates every 15s'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sf-orange" />
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-700">
        {error || 'Load not found'}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          to="/"
          className="text-sm text-sf-orange hover:text-sf-orange-hover hover:underline"
        >
          &larr; Back to Orders
        </Link>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sf-text-900">Load Tracking</h1>
          <p className="text-sm text-sf-text-500 mt-0.5">
            Truck {load.truckId}
          </p>
        </div>
        <StatusBadge status={load.status} className="text-sm px-3 py-1" />
      </div>

      {/* ETA hero card */}
      {load.etaMinutes != null && load.status !== 'COMPLETED' && (
        <div className="bg-gradient-to-br from-sf-orange to-sf-orange-hover rounded-xl shadow-lg p-6 mb-6 text-white">
          <p className="text-sm font-medium text-orange-100 uppercase tracking-wider">
            Estimated Time of Arrival
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-bold">{load.etaMinutes}</span>
            <span className="text-xl text-orange-200">minutes</span>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-sf-text-500 uppercase tracking-wider mb-4">
          Delivery Progress
        </h2>
        <LoadProgress currentStatus={load.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Driver info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-sf-text-500 uppercase tracking-wider mb-4">
            Driver Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-sf-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-sf-text-900">{load.driverName}</p>
                <p className="text-xs text-sf-text-500">{load.driverPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-sf-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 6h4l3 4v6h-2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-sf-text-900">Truck {load.truckId}</p>
                <p className="text-xs text-sf-text-500">Vehicle ID</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location & timestamps */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-sf-text-500 uppercase tracking-wider mb-4">
            Location & Timing
          </h3>
          <div className="space-y-3">
            {load.currentLat != null && load.currentLon != null && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Current Position</p>
                <p className="text-sm font-mono text-slate-700 mt-0.5">
                  {load.currentLat.toFixed(6)}, {load.currentLon.toFixed(6)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Departed</p>
              <p className="text-sm text-slate-700 mt-0.5">{formatTimestamp(load.departedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Arrived</p>
              <p className="text-sm text-slate-700 mt-0.5">{formatTimestamp(load.arrivedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
              <p className="text-sm text-slate-700 mt-0.5">{formatTimestamp(load.completedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection indicator */}
      {load.status !== 'COMPLETED' && connectionIndicator()}
    </div>
  );
}

// Prevent unused import warning
void React;
