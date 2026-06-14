import { UserRepository } from '../../users/repositories/user.repository';
import { BcryptHelper } from '../helpers/bcrypt.helper';
import { tokenService } from './token.service';
import { AppError } from '../../../shared/utils/appError';

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  identity: string;
  password: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  /**
   * Registers a new user account.
   * Checks for duplicate email and username via UserRepository, hashes password, and issues JWT tokens.
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
    const tokens = tokenService.generateAuthTokens(user.id);

    // 6. Return safe DTO response
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Authenticates a user with username/email and password.
   * Verifies identity, active status, and password correctness, then updates last login timestamp and returns auth tokens.
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
    const tokens = tokenService.generateAuthTokens(user.id);

    // 6. Return DTO response
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }
}
