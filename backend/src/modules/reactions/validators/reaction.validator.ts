import { z } from 'zod';

export const reactToSnapSchema = {
  params: z.object({
    id: z.string().uuid('Mã snap không hợp lệ (phải là UUID).'),
  }),
  body: z.object({
    emoji: z
      .string({
        required_error: 'Emoji là bắt buộc.',
      })
      .trim()
      .min(1, 'Emoji không được rỗng.')
      .max(32, 'Emoji không được vượt quá 32 ký tự.'),
  }),
};
