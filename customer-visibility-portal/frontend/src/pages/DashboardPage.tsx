import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import type { Order } from '../types';

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const data = await apiFetch<Order[]>('/portal/orders');
        if (!cancelled) {
          setOrders(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load orders',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  function truncateId(id: string): string {
    return id.length > 8 ? id.slice(0, 8) + '...' : id;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sf-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sf-text-900">Orders</h1>
        <p className="text-sm text-sf-text-500 mt-1">
          Track your concrete delivery orders
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <svg
            className="mx-auto w-12 h-12 text-slate-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sf-text-500">No orders found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Order ID
                  </th>
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Job
                  </th>
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Site
                  </th>
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Mix Design
                  </th>
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Qty
                  </th>
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Delivery
                  </th>
                  <th className="text-left text-xs font-semibold text-sf-text-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm font-mono text-sf-orange hover:text-sf-orange-hover hover:underline"
                      >
                        {truncateId(order.id)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-sf-text-900">
                      {order.jobName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.siteName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.mixDesign}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.quantityOrdered} {order.quantityUnit}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(order.deliveryDate)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-sf-orange-mid transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">
                    {truncateId(order.id)}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <h3 className="text-sm font-semibold text-sf-text-900">
                  {order.jobName}
                </h3>
                <p className="text-xs text-sf-text-500 mt-0.5">
                  {order.siteName}
                </p>
                <div className="flex items-center justify-between mt-3 text-xs text-sf-text-500">
                  <span>
                    {order.mixDesign} &middot; {order.quantityOrdered}{' '}
                    {order.quantityUnit}
                  </span>
                  <span>{formatDate(order.deliveryDate)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Prevent unused import warning
void React;
