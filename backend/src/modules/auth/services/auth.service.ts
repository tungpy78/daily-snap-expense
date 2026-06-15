import { UserRepository } from '../../users/repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { BcryptHelper } from '../helpers/bcrypt.helper';
import { tokenService } from './token.service';
import { AppError } from '../../../shared/utils/appError';
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshDto,
  LogoutDto,
} from '../dtos/auth.dto';
import sequelize from '../../../shared/database/index';

export class AuthService {
  /**
   * Registers a new user account.
   * Checks for duplicate email and username via UserRepository, hashes password, issues JWT tokens,
   * and saves the refresh token identifier (jti) in the database.
   */
  public static async register(data: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password } = data;

    // 1. Check for duplicate email
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      throw new AppError('Email đã được sử dụng.', 400, 'EMAIL_ALREADY_EXISTS');
    }

    // 2. Check for duplicate username
    const existingUsername = await UserRepository.findByUsername(username);
    if (existingUsername) {
      throw new AppError('Tên đăng nhập đã được sử dụng.', 400, 'USERNAME_ALREADY_EXISTS');
    }

    // 3. Hash password using BcryptHelper
    const passwordHash = await BcryptHelper.hashPassword(password);

    // 4. Create new user record using UserRepository
    const user = await UserRepository.create({
      username,
      email,
      passwordHash,
      role: 'user',
      isActive: true,
    });

    // 5. Generate Access & Refresh JWT tokens
    const tokenData = tokenService.generateAuthTokens(user.id);

    // Save refresh token record to DB
    await RefreshTokenRepository.create({
      id: tokenData.refreshTokenId,
      userId: user.id,
      expiresAt: tokenData.refreshTokenExpiresAt,
    });

    // 6. Return safe DTO response
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
      },
    };
  }

  /**
   * Authenticates a user with username/email and password.
   * Verifies identity, active status, and password correctness, updates last login timestamp,
   * saves the refresh token identifier (jti) in the database, and returns auth tokens.
   */
  public static async login(data: LoginDto): Promise<AuthResponseDto> {
    const { identity, password } = data;

    // 1. Find user by email or username
    const user = await UserRepository.findByIdentity(identity);
    if (!user) {
      throw new AppError(
        'Email/Tên đăng nhập hoặc mật khẩu không chính xác.',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    // 2. Check if user is active
    if (!user.is_active) {
      throw new AppError('Tài khoản đã bị khóa hoặc ngừng hoạt động.', 401, 'USER_INACTIVE');
    }

    // 3. Verify password
    const isPasswordValid = await BcryptHelper.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(
        'Email/Tên đăng nhập hoặc mật khẩu không chính xác.',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    // 4. Update last login timestamp in repository
    await UserRepository.updateLastLogin(user.id);

    // 5. Generate Access & Refresh JWT tokens
    const tokenData = tokenService.generateAuthTokens(user.id);

    // Save refresh token record to DB
    await RefreshTokenRepository.create({
      id: tokenData.refreshTokenId,
      userId: user.id,
      expiresAt: tokenData.refreshTokenExpiresAt,
    });

    // 6. Return DTO response
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
      },
    };
  }

  /**
   * Refreshes access and refresh tokens using an old valid refresh token.
   * Utilizes Refresh Token Rotation (RTR) and performs atomic delete-and-check under a database transaction.
   */
  public static async refresh(
    data: RefreshDto,
  ): Promise<{ tokens: { accessToken: string; refreshToken: string } }> {
    const { refreshToken } = data;

    // 1. Verify refresh token signature & expiration
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    const { userId, jti } = decoded;

    // 2. Perform RTR atomically under transaction
    const t = await sequelize.transaction();
    try {
      // Delete old token
      const affectedRows = await RefreshTokenRepository.deleteExistingById(jti, t);

      // If no token was deleted, it means the token was either already rotated/used, or expired
      if (affectedRows === 0) {
        throw new AppError('Token không hợp lệ hoặc đã hết hạn.', 401, 'INVALID_TOKEN');
      }

      // Generate new tokens
      const tokenData = tokenService.generateAuthTokens(userId);

      // Save new refresh token record
      await RefreshTokenRepository.create(
        {
          id: tokenData.refreshTokenId,
          userId,
          expiresAt: tokenData.refreshTokenExpiresAt,
        },
        t,
      );

      await t.commit();

      return {
        tokens: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
        },
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Logs out a user by deleting/revoking their refresh token in the database.
   */
  public static async logout(data: LogoutDto): Promise<void> {
    const { refreshToken } = data;

    // 1. Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    const { jti } = decoded;

    // 2. Delete/revoke refresh token from database
    const affectedRows = await RefreshTokenRepository.deleteById(jti);
    if (affectedRows === 0) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn.', 401, 'INVALID_TOKEN');
    }
  }
}
