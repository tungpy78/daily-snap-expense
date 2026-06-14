import { z } from 'zod';

export const registerBodySchema = z.object({
  username: z
    .string({ required_error: 'Tên đăng nhập là bắt buộc' })
    .trim()
    .min(3, 'Tên đăng nhập phải từ 3 đến 50 ký tự')
    .max(50, 'Tên đăng nhập phải từ 3 đến 50 ký tự')
    .toLowerCase()
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số và dấu gạch dưới'),
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .trim()
    .email('Email không đúng định dạng')
    .max(100, 'Email tối đa 100 ký tự')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

export const registerSchema = {
  body: registerBodySchema,
};

export const loginBodySchema = z.object({
  identity: z
    .string({ required_error: 'Email hoặc tên đăng nhập là bắt buộc' })
    .trim()
    .min(1, 'Email hoặc tên đăng nhập không được để trống'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(1, 'Mật khẩu không được để trống'),
});

export const loginSchema = {
  body: loginBodySchema,
};
