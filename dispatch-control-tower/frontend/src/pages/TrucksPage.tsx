import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import type {
  Truck,
  CreateTruckBody,
  UpdateTruckBody,
  TruckStatus,
} from '../types';
import StatusBadge from '../components/StatusBadge';

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail / edit state
  const [selected, setSelected] = useState<Truck | null>(null);
  const [editStatus, setEditStatus] = useState<TruckStatus | ''>('');
  const [editNotes, setEditNotes] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [saving, setSaving] = useState(false);

  // Add truck state
  const [showAdd, setShowAdd] = useState(false);
  const [addNumber, setAddNumber] = useState('');
  const [addPlate, setAddPlate] = useState('');
  const [addCapacity, setAddCapacity] = useState('');
  const [addUnit, setAddUnit] = useState<'CY' | 'CM'>('CY');
  const [addNotes, setAddNotes] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Truck[]>('/trucks');
      setTrucks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load trucks',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  function openDetail(truck: Truck) {
    setSelected(truck);
    setEditStatus(truck.status);
    setEditNotes(truck.notes ?? '');
    setEditPlate(truck.licensePlate ?? '');
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      const body: UpdateTruckBody = {};
      if (editStatus && editStatus !== selected.status)
        body.status = editStatus as TruckStatus;
      if (editNotes !== (selected.notes ?? ''))
        body.notes = editNotes || null;
      if (editPlate !== (selected.licensePlate ?? ''))
        body.licensePlate = editPlate || null;

      await apiFetch<Truck>(`/trucks/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setSelected(null);
      await fetchTrucks();
    } catch {
      // keep form open
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAdding(true);

    try {
      const body: CreateTruckBody = {
        number: addNumber,
        licensePlate: addPlate || null,
        capacityAmount: addCapacity ? parseFloat(addCapacity) : null,
        capacityUnit: addUnit,
        notes: addNotes || null,
      };
      await apiFetch<Truck>('/trucks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowAdd(false);
      setAddNumber('');
      setAddPlate('');
      setAddCapacity('');
      setAddNotes('');
      await fetchTrucks();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Failed to create truck',
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trucks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage fleet trucks and their availability
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
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
          Add Truck
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Home Plant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                      Loading trucks...
                    </div>
                  </td>
                </tr>
              ) : trucks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    No trucks registered yet. Add your first truck to get
                    started.
                  </td>
                </tr>
              ) : (
                trucks.map((truck, idx) => (
                  <tr
                    key={truck.id}
                    onClick={() => openDetail(truck)}
                    className={`cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/40 transition-colors`}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                      {truck.number}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {truck.licensePlate ?? '--'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {truck.capacityAmount != null
                        ? `${truck.capacityAmount} ${truck.capacityUnit}`
                        : '--'}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge value={truck.status} category="truck" />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {truck.homePlantId?.slice(0, 8) ?? '--'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">
                      {truck.notes ?? '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Edit slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Truck {selected.number}
              </h2>
              <button
                onClick={() => setSelected(null)}
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as TruckStatus)
                  }
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  License Plate
                </label>
                <input
                  type="text"
                  value={editPlate}
                  onChange={(e) => setEditPlate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add truck modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Truck
              </h2>
              <button
                onClick={() => setShowAdd(false)}
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

            {addError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Truck Number
                </label>
                <input
                  type="text"
                  required
                  value={addNumber}
                  onChange={(e) => setAddNumber(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  placeholder="e.g. T-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  License Plate
                </label>
                <input
                  type="text"
                  value={addPlate}
                  onChange={(e) => setAddPlate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Capacity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={addCapacity}
                    onChange={(e) => setAddCapacity(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Unit
                  </label>
                  <select
                    value={addUnit}
                    onChange={(e) =>
                      setAddUnit(e.target.value as 'CY' | 'CM')
                    }
                    className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  >
                    <option value="CY">CY (Cubic Yards)</option>
                    <option value="CM">CM (Cubic Meters)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  rows={2}
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition resize-none"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {adding ? 'Creating...' : 'Add Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Prevent unused import warning
void React;
