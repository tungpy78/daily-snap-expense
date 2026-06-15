import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../modules/auth/services/token.service';
import { UserRepository } from '../modules/users/repositories/user.repository';
import { AppError } from '../shared/utils/appError';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
    }

    // Verify token throws AppError with TOKEN_EXPIRED or INVALID_TOKEN on failure
    const decoded = tokenService.verifyAccessToken(token);
    const { userId } = decoded;

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại.', 401, 'USER_NOT_FOUND');
    }

    if (!user.is_active) {
      throw new AppError('Tài khoản đã bị khóa hoặc ngừng hoạt động.', 401, 'USER_INACTIVE');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
