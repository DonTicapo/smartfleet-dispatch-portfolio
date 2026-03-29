import { z } from 'zod';

export const MessageIdParam = z.object({
  messageId: z.string().uuid(),
});

export type MessageIdParam = z.infer<typeof MessageIdParam>;

export const ListMessagesQuery = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type ListMessagesQuery = z.infer<typeof ListMessagesQuery>;
