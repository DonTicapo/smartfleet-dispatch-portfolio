import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import type { Order, Ticket, Load } from '../types';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketLoads, setTicketLoads] = useState<Record<string, Load[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [orderData, ticketsData] = await Promise.all([
          apiFetch<Order>(`/portal/orders/${orderId}`),
          apiFetch<Ticket[]>(`/portal/orders/${orderId}/tickets`),
        ]);
        if (!cancelled) {
          setOrder(orderData);
          setTickets(ticketsData);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load order',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function toggleTicket(ticketId: string) {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }

    setExpandedTicket(ticketId);

    if (!ticketLoads[ticketId]) {
      try {
        const loads = await apiFetch<Load[]>(
          `/portal/tickets/${ticketId}/loads`,
        );
        setTicketLoads((prev) => ({ ...prev, [ticketId]: loads }));
      } catch {
        setTicketLoads((prev) => ({ ...prev, [ticketId]: [] }));
      }
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-700">
        {error || 'Order not found'}
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

      {/* Order summary card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {order.jobName}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{order.siteName}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Order ID
            </p>
            <p className="text-sm font-mono text-slate-700 mt-1">{order.id}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Mix Design
            </p>
            <p className="text-sm text-slate-700 mt-1">{order.mixDesign}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Quantity
            </p>
            <p className="text-sm text-slate-700 mt-1">
              {order.quantityOrdered} {order.quantityUnit}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Delivery Date
            </p>
            <p className="text-sm text-slate-700 mt-1">
              {formatDate(order.deliveryDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Tickets</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} for this
          order
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
          No tickets created yet
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicket === ticket.id;
            const loads = ticketLoads[ticket.id];

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Ticket header */}
                <button
                  onClick={() => toggleTicket(ticket.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">
                        Ticket #{ticket.ticketNumber}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(ticket.scheduledDate)} &middot;{' '}
                        {ticket.quantityRequested} {ticket.quantityUnit}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={ticket.status} />
                </button>

                {/* Expanded loads */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
                    {!loads ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        Loading...
                      </div>
                    ) : loads.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No loads assigned yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Loads
                        </p>
                        {loads.map((load) => (
                          <Link
                            key={load.id}
                            to={`/loads/${load.id}`}
                            className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <svg
                                className="w-5 h-5 text-slate-400"
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
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  Truck {load.truckId}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {load.driverName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {load.etaMinutes != null && (
                                <span className="text-xs text-slate-500">
                                  ETA: {load.etaMinutes} min
                                </span>
                              )}
                              <StatusBadge status={load.status} />
                              <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </Link>
                        ))}
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
