import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import type { Truck, Driver, Assignment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AssignmentModal({ open, onClose, onCreated }: Props) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadId, setLoadId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadData() {
      try {
        const [truckList, driverList] = await Promise.all([
          apiFetch<Truck[]>('/trucks?status=AVAILABLE'),
          apiFetch<Driver[]>('/drivers?status=AVAILABLE'),
        ]);
        if (!cancelled) {
          setTrucks(truckList);
          setDrivers(driverList);
        }
      } catch {
        // silently fail -- dropdowns will be empty
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function reset() {
    setLoadId('');
    setTruckId('');
    setDriverId('');
    setNotes('');
    setError('');
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiFetch<Assignment>('/dispatch/assignments', {
        method: 'POST',
        body: JSON.stringify({
          loadId,
          truckId,
          driverId,
          notes: notes || null,
        }),
      });
      reset();
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create assignment',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl border border-sf-border w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-sf-text-900">
            New Assignment
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="loadId"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Load ID
            </label>
            <input
              id="loadId"
              type="text"
              required
              value={loadId}
              onChange={(e) => setLoadId(e.target.value)}
              className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
              placeholder="Enter load ID"
            />
          </div>

          <div>
            <label
              htmlFor="truckId"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Truck
            </label>
            <select
              id="truckId"
              required
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
              className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
            >
              <option value="">Select a truck...</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.number}
                  {t.licensePlate ? ` (${t.licensePlate})` : ''} -{' '}
                  {t.capacityAmount ?? '?'} {t.capacityUnit}
                </option>
              ))}
            </select>
            {trucks.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">
                No available trucks found
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="driverId"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Driver
            </label>
            <select
              id="driverId"
              required
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
            >
              <option value="">Select a driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                  {d.licenseNumber ? ` (${d.licenseNumber})` : ''}
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="mt-1 text-xs text-slate-400">
                No available drivers found
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition resize-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-sf-border rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sf-orange to-sf-orange-hover rounded-full shadow-[0_4px_24px_rgba(214,81,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(214,81,42,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
