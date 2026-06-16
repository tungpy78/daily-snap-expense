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

export const friendFeedQuerySchema = {
  query: z.object({
    limit: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return undefined;
        }
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      },
      z
        .number({ invalid_type_error: 'Limit phải là số.' })
        .int('Limit phải là số nguyên.')
        .min(1, 'Limit phải lớn hơn hoặc bằng 1.')
        .max(100, 'Limit không được vượt quá 100.')
        .default(20),
    ),
    offset: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return undefined;
        }
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      },
      z
        .number({ invalid_type_error: 'Offset phải là số.' })
        .int('Offset phải là số nguyên.')
        .min(0, 'Offset phải lớn hơn hoặc bằng 0.')
        .default(0),
    ),
  }),
};
