import { z } from 'zod';

const expenseItemSchema = z.object({
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
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null))
    .nullable()
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD.')
    .optional(),
});

export const createSnapSchema = {
  body: z.object({
    caption: z
      .string()
      .trim()
      .max(1000, 'Caption không được vượt quá 1000 ký tự.')
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null))
      .nullable()
      .optional(),
    isPrivate: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return undefined;
        }
        if (val === 'true') {
          return true;
        }
        if (val === 'false') {
          return false;
        }
        if (typeof val === 'boolean') {
          return val;
        }
        return val;
      },
      z
        .boolean({
          required_error: 'Quyền riêng tư là bắt buộc.',
          invalid_type_error: 'Quyền riêng tư phải là boolean.',
        })
        .default(true),
    ),
    expenses: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return [];
        }
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return null; // Force Zod array validation error
          }
        }
        return val;
      },
      z
        .array(expenseItemSchema, { invalid_type_error: 'Danh sách chi tiêu phải là một mảng.' })
        .default([]),
    ),
  }),
};
