import { z } from 'zod';
import { EventSource } from '../../../domain/enums/event-source.js';

export const IngestEventBody = z.object({
  eventId: z.string().min(1),
  source: z.nativeEnum(EventSource),
  eventType: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  occurredAt: z.coerce.date(),
});

export type IngestEventBody = z.infer<typeof IngestEventBody>;

export const EventQueryParams = z.object({
  source: z.nativeEnum(EventSource).optional(),
  eventType: z.string().optional(),
  aggregateType: z.string().optional(),
  aggregateId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type EventQueryParams = z.infer<typeof EventQueryParams>;
