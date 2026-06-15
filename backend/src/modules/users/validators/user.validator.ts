import { z } from 'zod';

export const updateProfileSchema = {
  body: z.object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Tên đăng nhập phải từ 3 đến 50 ký tự.')
      .max(50, 'Tên đăng nhập phải từ 3 đến 50 ký tự.')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Tên đăng nhập chỉ được chứa chữ cái không dấu, số và dấu gạch dưới.',
      )
      .optional(),
  }),
};
export type UpdateProfileSchemaType = typeof updateProfileSchema;
