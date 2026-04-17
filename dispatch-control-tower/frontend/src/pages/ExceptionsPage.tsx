import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import type { DispatchException, UpdateExceptionBody } from '../types';
import StatusBadge from '../components/StatusBadge';

type TabFilter = 'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

const tabs: { key: TabFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'RESOLVED', label: 'Resolved' },
];

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<DispatchException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const query =
        activeTab === 'ALL' ? '' : `?status=${activeTab}`;
      const data = await apiFetch<DispatchException[]>(
        `/dispatch/exceptions${query}`,
      );
      setExceptions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load exceptions',
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  async function handleStatusUpdate(
    id: string,
    newStatus: UpdateExceptionBody['status'],
  ) {
    setUpdating(id);
    try {
      const body: UpdateExceptionBody = {
        status: newStatus,
        resolution: newStatus === 'RESOLVED' ? resolution || null : null,
      };
      await apiFetch(`/dispatch/exceptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setResolution('');
      setExpandedId(null);
      await fetchExceptions();
    } catch {
      // keep card open
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sf-text-900 font-serif">Exceptions</h1>
        <p className="text-sm text-sf-text-500 mt-1">
          Track and resolve dispatch exceptions and incidents
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setExpandedId(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === tab.key
                ? 'bg-white text-sf-text-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Exception cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <svg
            className="w-5 h-5 animate-spin mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading exceptions...
        </div>
      ) : exceptions.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">
          No exceptions found
          {activeTab !== 'ALL' ? ` with status "${activeTab}"` : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {exceptions.map((exc) => {
            const isExpanded = expandedId === exc.id;
            return (
              <div
                key={exc.id}
                className="bg-white rounded-lg border border-sf-border shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : exc.id)
                  }
                  className="w-full px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          value={exc.type}
                          category="exceptionType"
                        />
                        <StatusBadge
                          value={exc.status}
                          category="exceptionStatus"
                        />
                        <StatusBadge
                          value={exc.severity}
                          category="severity"
                        />
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-sf-text-900">
                        {exc.title}
                      </h3>
                      {exc.description && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {exc.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">
                        {formatDate(exc.createdAt)}
                      </p>
                      <svg
                        className={`w-4 h-4 text-slate-400 mt-2 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-slate-500">Reported by:</span>{' '}
                        <span className="font-medium text-sf-text-900">
                          {exc.reportedBy}
                        </span>
                      </div>
                      {exc.assignmentId && (
                        <div>
                          <span className="text-slate-500">
                            Assignment:
                          </span>{' '}
                          <span className="font-mono text-slate-700">
                            {exc.assignmentId.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      {exc.loadId && (
                        <div>
                          <span className="text-slate-500">Load:</span>{' '}
                          <span className="font-mono text-slate-700">
                            {exc.loadId.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      {exc.truckId && (
                        <div>
                          <span className="text-slate-500">Truck:</span>{' '}
                          <span className="font-mono text-slate-700">
                            {exc.truckId.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Created:</span>{' '}
                        <span className="text-slate-700">
                          {formatDate(exc.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Updated:</span>{' '}
                        <span className="text-slate-700">
                          {formatDate(exc.updatedAt)}
                        </span>
                      </div>
                      {exc.resolvedBy && (
                        <div>
                          <span className="text-slate-500">
                            Resolved by:
                          </span>{' '}
                          <span className="font-medium text-sf-text-900">
                            {exc.resolvedBy}
                          </span>
                        </div>
                      )}
                      {exc.resolution && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Resolution:</span>{' '}
                          <span className="text-slate-700">
                            {exc.resolution}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {exc.status !== 'RESOLVED' && exc.status !== 'CLOSED' && (
                      <div className="border-t border-slate-100 pt-4">
                        {exc.status === 'OPEN' && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(exc.id, 'ACKNOWLEDGED')
                            }
                            disabled={updating === exc.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition mr-2"
                          >
                            {updating === exc.id
                              ? 'Updating...'
                              : 'Acknowledge'}
                          </button>
                        )}
                        {(exc.status === 'OPEN' ||
                          exc.status === 'ACKNOWLEDGED' ||
                          exc.status === 'IN_PROGRESS') && (
                          <div className="inline-flex items-center gap-2">
                            <input
                              type="text"
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              className="rounded-lg border border-sf-border px-3 py-2 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                              placeholder="Resolution notes..."
                            />
                            <button
                              onClick={() =>
                                handleStatusUpdate(exc.id, 'RESOLVED')
                              }
                              disabled={updating === exc.id}
                              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                              {updating === exc.id
                                ? 'Updating...'
                                : 'Resolve'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Prevent unused import warning
void React;
