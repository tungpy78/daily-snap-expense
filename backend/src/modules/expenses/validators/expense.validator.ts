import { z } from 'zod';

export const createExpenseSchema = {
  body: z.object({
    amount: z
      .number({
        required_error: 'Số tiền là bắt buộc.',
        invalid_type_error: 'Số tiền phải là số.',
      })
      .positive('Số tiền phải lớn hơn 0.'),
    categoryId: z
      .string({
        required_error: 'Mã danh mục là bắt buộc.',
      })
      .uuid('Mã danh mục không hợp lệ (phải là UUID).'),
    note: z
      .string()
      .trim()
      .max(1000, 'Ghi chú không được vượt quá 1000 ký tự.')
      .nullable()
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD.')
      .optional(),
    snapId: z.string().uuid('Mã snap không hợp lệ (phải là UUID).').nullable().optional(),
  }),
};

export type CreateExpenseSchemaType = typeof createExpenseSchema;
