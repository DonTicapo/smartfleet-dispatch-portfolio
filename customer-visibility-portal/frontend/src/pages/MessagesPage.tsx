import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import type { Message } from '../types';

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      try {
        const data = await apiFetch<Message[]>('/portal/messages');
        if (!cancelled) {
          setMessages(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load messages',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExpand(msg: Message) {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(msg.id);

    // Mark as read if unread
    if (!msg.isRead) {
      try {
        await apiFetch(`/portal/messages/${msg.id}/read`, { method: 'PATCH' });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)),
        );
      } catch {
        // Silently fail - message is still readable
      }
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m ago`;
    }
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">
          {unreadCount > 0
            ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
            : 'All messages read'}
        </p>
      </div>

      {messages.length === 0 ? (
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-slate-500">No messages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
                  !msg.isRead
                    ? 'border-blue-200 bg-blue-50/30'
                    : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => handleExpand(msg)}
                  className="w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  {/* Unread indicator */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!msg.isRead ? (
                      <span className="block w-2.5 h-2.5 rounded-full bg-blue-500" />
                    ) : (
                      <span className="block w-2.5 h-2.5 rounded-full bg-transparent" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`text-sm truncate ${
                          !msg.isRead
                            ? 'font-bold text-slate-900'
                            : 'font-medium text-slate-700'
                        }`}
                      >
                        {msg.subject}
                      </h3>
                      <StatusBadge status={msg.severity} />
                    </div>
                    {!isExpanded && (
                      <p className="text-sm text-slate-500 truncate">
                        {msg.body}
                      </p>
                    )}
                  </div>

                  {/* Timestamp + chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {formatDate(msg.createdAt)}
                    </span>
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
                  </div>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-4 pl-16">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {msg.body}
                    </p>
                    <p className="text-xs text-slate-400 mt-4">
                      {new Date(msg.createdAt).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
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
