import { z } from 'zod';

export const CreateWebhookBody = z.object({
  url: z.string().url(),
  eventTypes: z.array(z.string().min(1)).min(1),
  secret: z.string().min(16).optional(),
});

export type CreateWebhookBody = z.infer<typeof CreateWebhookBody>;
