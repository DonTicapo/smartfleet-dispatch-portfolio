import { z } from 'zod';

export const CreateTicketBody = z.object({
  orderId: z.string().uuid(),
  ticketNumber: z.string().min(1),
  scheduledDate: z.string(),
  plantId: z.string().nullish(),
  notes: z.string().nullish(),
});

export type CreateTicketBody = z.infer<typeof CreateTicketBody>;
