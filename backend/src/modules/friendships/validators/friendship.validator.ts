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

export const respondFriendRequestSchema = {
  params: z.object({
    id: z.string().uuid('Mã lời mời kết bạn không hợp lệ (phải là UUID).'),
  }),
  body: z.object({
    action: z.enum(['ACCEPT', 'DECLINE'], {
      required_error: 'Action là bắt buộc.',
      invalid_type_error: 'Action phải là ACCEPT hoặc DECLINE.',
    }),
  }),
};
