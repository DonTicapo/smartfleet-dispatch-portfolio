import { z } from 'zod';

export const TicketIdParam = z.object({
  ticketId: z.string().uuid(),
});

export type TicketIdParam = z.infer<typeof TicketIdParam>;
