import { z } from 'zod';

export const ListOrdersQuery = z.object({
  status: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type ListOrdersQuery = z.infer<typeof ListOrdersQuery>;

export const OrderIdParam = z.object({
  orderId: z.string().uuid(),
});

export type OrderIdParam = z.infer<typeof OrderIdParam>;
