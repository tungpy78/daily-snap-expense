import { z } from 'zod';

export const sendFriendRequestSchema = {
  body: z.object({
    receiverIdentity: z
      .string({
        required_error: 'receiverIdentity là bắt buộc.',
      })
      .trim()
      .min(1, 'receiverIdentity không được rỗng.')
      .max(100, 'receiverIdentity không được vượt quá 100 ký tự.'),
  }),
};
