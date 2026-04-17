import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import type { DispatchBoardEntry } from '../types';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import AssignmentModal from '../components/AssignmentModal';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DispatchBoardPage() {
  const [date, setDate] = useState(todayISO);
  const [entries, setEntries] = useState<DispatchBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<DispatchBoardEntry | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBoard = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setLoading(true);
      setError('');
      try {
        const data = await apiFetch<DispatchBoardEntry[]>(
          `/dispatch/board?date=${date}`,
        );
        setEntries(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dispatch board',
        );
      } finally {
        setLoading(false);
      }
    },
    [date],
  );

  // Initial load & date change
  useEffect(() => {
    fetchBoard(true);
  }, [fetchBoard]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchBoard(false), 30000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await apiFetch<DispatchBoardEntry[]>('/dispatch/board/refresh', {
        method: 'POST',
        body: JSON.stringify({ date }),
      });
      await fetchBoard(false);
    } catch {
      // Silent fail -- board will show stale data
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget?.assignmentId) return;
    setCancelling(true);
    try {
      await apiFetch(
        `/dispatch/assignments/${cancelTarget.assignmentId}/cancel`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            reason: cancelReason || 'Cancelled by dispatcher',
          }),
        },
      );
      setCancelTarget(null);
      setCancelReason('');
      await fetchBoard(false);
    } catch {
      // keep dialog open on failure
    } finally {
      setCancelling(false);
    }
  }

  // Summary stats
  const totalAssignments = entries.filter((e) => e.assignmentId).length;
  const activeLoads = entries.filter(
    (e) =>
      e.assignmentStatus === 'CONFIRMED' ||
      e.assignmentStatus === 'IN_PROGRESS',
  ).length;
  const withExceptions = entries.filter((e) => e.hasExceptions).length;
  const availableTrucks = new Set(
    entries.filter((e) => !e.truckId).map((e) => e.loadId),
  ).size;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sf-text-900 font-serif">Dispatch Board</h1>
          <p className="text-sm text-sf-text-500 mt-1">
            Manage daily load assignments and track dispatch operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-sf-border px-3 py-2 text-sm text-sf-text-900 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
          />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-sf-border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sf-orange to-sf-orange-hover rounded-full shadow-[0_4px_24px_rgba(214,81,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(214,81,42,0.4)] transition-all"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Assignment
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up">
        <SummaryCard
          title="Total Assignments"
          value={totalAssignments}
          color="blue"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          }
        />
        <SummaryCard
          title="Active Loads"
          value={activeLoads}
          color="green"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <SummaryCard
          title="Open Exceptions"
          value={withExceptions}
          color="amber"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          }
        />
        <SummaryCard
          title="Unassigned Loads"
          value={availableTrucks}
          color="red"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 6h4l3 4v6h-2"
              />
            </svg>
          }
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-sf-border shadow-sm overflow-hidden animate-fade-up delay-2">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-sf-border">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Load ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer / Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Truck
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <svg
                        className="w-5 h-5 animate-spin"
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
                      Loading dispatch board...
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    No entries for {date}. Try refreshing the board or selecting
                    a different date.
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sf-bg-gray/50'} hover:bg-sf-orange-light/40 transition-colors`}
                  >
                    <td className="px-6 py-3.5 text-sm font-mono font-medium text-sf-text-900">
                      {entry.loadId.slice(0, 8)}...
                      {entry.hasExceptions && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400" title="Has exceptions" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {entry.ticketNumber}
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <div className="font-medium text-sf-text-900">
                        {entry.customerName}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {entry.siteName}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {entry.truckNumber ?? (
                        <span className="text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {entry.driverName ?? (
                        <span className="text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {entry.assignmentStatus ? (
                        <StatusBadge
                          value={entry.assignmentStatus}
                          category="assignment"
                        />
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500">
                          NO ASSIGNMENT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {entry.scheduledTime
                        ? new Date(entry.scheduledTime).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )
                        : '--'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {entry.assignmentId &&
                        entry.assignmentStatus !== 'CANCELLED' &&
                        entry.assignmentStatus !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setCancelTarget(entry);
                              setCancelReason('');
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-800 transition"
                          >
                            Cancel
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment modal */}
      <AssignmentModal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onCreated={() => {
          setShowAssignmentModal(false);
          fetchBoard(false);
        }}
      />

      {/* Cancel confirmation */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-sf-border w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-sf-text-900">
              Cancel Assignment
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Cancel the assignment for load{' '}
              <span className="font-mono font-medium">
                {cancelTarget.loadId.slice(0, 8)}
              </span>
              ?
            </p>
            <div className="mt-4">
              <label
                htmlFor="cancelReason"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Reason
              </label>
              <input
                id="cancelReason"
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                placeholder="Enter cancellation reason..."
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-sf-border rounded-lg hover:bg-slate-50 transition"
              >
                Keep Assignment
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Prevent unused import warning
void React;
