import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import LoadProgress from '../components/LoadProgress';
import StatusBadge from '../components/StatusBadge';
import type { Load } from '../types';

export default function LoadTrackingPage() {
  const { loadId } = useParams<{ loadId: string }>();
  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLoad() {
      try {
        const data = await apiFetch<Load>(`/portal/loads/${loadId}`);
        if (!cancelled) {
          setLoad(data);
          setError('');
          setLoading(false);

          // Stop polling once completed
          if (data.status === 'COMPLETED' && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load tracking data',
          );
          setLoading(false);
        }
      }
    }

    fetchLoad();
    intervalRef.current = setInterval(fetchLoad, 15000);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadId]);

  function formatTimestamp(ts: string | null): string {
    if (!ts) return '--';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          &larr; Back to Orders
        </Link>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Load Tracking</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Truck {load.truckId} &middot; Auto-refreshes every 15s
          </p>
        </div>
        <StatusBadge status={load.status} className="text-sm px-3 py-1" />
      </div>

      {/* ETA hero card */}
      {load.etaMinutes != null && load.status !== 'COMPLETED' && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">
            Estimated Time of Arrival
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-bold">{load.etaMinutes}</span>
            <span className="text-xl text-blue-200">minutes</span>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Delivery Progress
        </h2>
        <LoadProgress currentStatus={load.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Driver info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Driver Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {load.driverName}
                </p>
                <p className="text-xs text-slate-500">{load.driverPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 6h4l3 4v6h-2"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Truck {load.truckId}
                </p>
                <p className="text-xs text-slate-500">Vehicle ID</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location & timestamps */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Location & Timing
          </h3>
          <div className="space-y-3">
            {load.currentLat != null && load.currentLon != null && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Current Position
                </p>
                <p className="text-sm font-mono text-slate-700 mt-0.5">
                  {load.currentLat.toFixed(6)}, {load.currentLon.toFixed(6)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Departed
              </p>
              <p className="text-sm text-slate-700 mt-0.5">
                {formatTimestamp(load.departedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Arrived
              </p>
              <p className="text-sm text-slate-700 mt-0.5">
                {formatTimestamp(load.arrivedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Completed
              </p>
              <p className="text-sm text-slate-700 mt-0.5">
                {formatTimestamp(load.completedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      {load.status !== 'COMPLETED' && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live tracking active
        </div>
      )}
    </div>
  );
}

// Prevent unused import warning
void React;
