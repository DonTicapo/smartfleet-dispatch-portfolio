import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import type {
  Driver,
  CreateDriverBody,
  UpdateDriverBody,
  DriverStatus,
} from '../types';
import StatusBadge from '../components/StatusBadge';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail / edit state
  const [selected, setSelected] = useState<Driver | null>(null);
  const [editStatus, setEditStatus] = useState<DriverStatus | ''>('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Add driver state
  const [showAdd, setShowAdd] = useState(false);
  const [addFirst, setAddFirst] = useState('');
  const [addLast, setAddLast] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addLicense, setAddLicense] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Driver[]>('/drivers');
      setDrivers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load drivers',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  function openDetail(driver: Driver) {
    setSelected(driver);
    setEditStatus(driver.status);
    setEditPhone(driver.phone ?? '');
    setEditNotes(driver.notes ?? '');
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      const body: UpdateDriverBody = {};
      if (editStatus && editStatus !== selected.status)
        body.status = editStatus as DriverStatus;
      if (editPhone !== (selected.phone ?? ''))
        body.phone = editPhone || null;
      if (editNotes !== (selected.notes ?? ''))
        body.notes = editNotes || null;

      await apiFetch<Driver>(`/drivers/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setSelected(null);
      await fetchDrivers();
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
      const body: CreateDriverBody = {
        firstName: addFirst,
        lastName: addLast,
        phone: addPhone || null,
        licenseNumber: addLicense || null,
        notes: addNotes || null,
      };
      await apiFetch<Driver>('/drivers', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowAdd(false);
      setAddFirst('');
      setAddLast('');
      setAddPhone('');
      setAddLicense('');
      setAddNotes('');
      await fetchDrivers();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Failed to create driver',
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
          <h1 className="text-2xl font-bold text-sf-text-900 font-serif">Drivers</h1>
          <p className="text-sm text-sf-text-500 mt-1">
            Manage driver roster and availability
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
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
          Add Driver
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-sf-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  License Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
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
                      Loading drivers...
                    </div>
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    No drivers registered yet. Add your first driver to get
                    started.
                  </td>
                </tr>
              ) : (
                drivers.map((driver, idx) => (
                  <tr
                    key={driver.id}
                    onClick={() => openDetail(driver)}
                    className={`cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-sf-orange-light/40 transition-colors`}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-sf-text-900">
                      {driver.firstName} {driver.lastName}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600 font-mono">
                      {driver.licenseNumber ?? '--'}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge value={driver.status} category="driver" />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {driver.phone ?? '--'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">
                      {driver.notes ?? '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Edit modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-sf-border w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-sf-text-900">
                {selected.firstName} {selected.lastName}
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
                    setEditStatus(e.target.value as DriverStatus)
                  }
                  className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="OFF_DUTY">Off Duty</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
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
                  className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-sf-border rounded-lg hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sf-orange to-sf-orange-hover rounded-full shadow-[0_4px_24px_rgba(214,81,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(214,81,42,0.4)] disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add driver modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-sf-border w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-sf-text-900">
                Add Driver
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addFirst}
                    onChange={(e) => setAddFirst(e.target.value)}
                    className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addLast}
                    onChange={(e) => setAddLast(e.target.value)}
                    className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  License Number
                </label>
                <input
                  type="text"
                  value={addLicense}
                  onChange={(e) => setAddLicense(e.target.value)}
                  className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition"
                  placeholder="CDL-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  rows={2}
                  className="block w-full rounded-lg border border-sf-border px-3.5 py-2.5 text-sm text-sf-text-900 placeholder-sf-text-300 focus:border-sf-orange focus:ring-2 focus:ring-sf-orange/20 focus:outline-none transition resize-none"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-sf-border rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sf-orange to-sf-orange-hover rounded-full shadow-[0_4px_24px_rgba(214,81,42,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(214,81,42,0.4)] disabled:opacity-50 transition-all"
                >
                  {adding ? 'Creating...' : 'Add Driver'}
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
