import { z } from 'zod';

export const createCategorySchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Tên danh mục là bắt buộc.' })
      .trim()
      .min(1, 'Tên danh mục không được để trống.')
      .max(50, 'Tên danh mục không được vượt quá 50 ký tự.'),
    color: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine((val) => !val || val === '' || /^#[0-9A-Fa-f]{6}$/.test(val), {
        message: 'Mã màu Hex phải có định dạng #RRGGBB (ví dụ: #FF5733).',
      }),
    icon: z.string().trim().max(50, 'Tên icon không được vượt quá 50 ký tự.').nullable().optional(),
  }),
};

export type CreateCategorySchemaType = typeof createCategorySchema;
