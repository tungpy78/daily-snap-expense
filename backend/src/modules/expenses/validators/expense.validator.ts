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

export const listExpensesSchema = {
  query: z
    .object({
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải có định dạng YYYY-MM-DD.')
        .optional(),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải có định dạng YYYY-MM-DD.')
        .optional(),
      categoryId: z.string().uuid('Mã danh mục không hợp lệ (phải là UUID).').optional(),
      limit: z.coerce
        .number({ invalid_type_error: 'Limit phải là số.' })
        .int('Limit phải là số nguyên.')
        .min(1, 'Limit phải lớn hơn hoặc bằng 1.')
        .max(100, 'Limit không được vượt quá 100.')
        .default(20),
      offset: z.coerce
        .number({ invalid_type_error: 'Offset phải là số.' })
        .int('Offset phải là số nguyên.')
        .min(0, 'Offset phải lớn hơn hoặc bằng 0.')
        .default(0),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.startDate <= data.endDate;
        }
        return true;
      },
      {
        message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.',
        path: ['startDate'],
      },
    ),
};

export const updateExpenseSchema = {
  params: z.object({
    id: z.string().uuid('Mã chi tiêu không hợp lệ (phải là UUID).'),
  }),
  body: z
    .object({
      amount: z
        .number({
          invalid_type_error: 'Số tiền phải là số.',
        })
        .positive('Số tiền phải lớn hơn 0.')
        .optional(),
      categoryId: z.string().uuid('Mã danh mục không hợp lệ (phải là UUID).').optional(),
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
    })
    .refine(
      (body) => {
        return Object.keys(body).length > 0;
      },
      {
        message: 'Yêu cầu ít nhất một trường dữ liệu hợp lệ để cập nhật.',
      },
    ),
};

export type CreateExpenseSchemaType = typeof createExpenseSchema;
export type ListExpensesSchemaType = typeof listExpensesSchema;
export type UpdateExpenseSchemaType = typeof updateExpenseSchema;
