import jwt, { type SignOptions, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { AppError } from '../../../shared/utils/appError';

export type JwtExpiresIn = SignOptions['expiresIn'];

export interface TokenPayload {
  userId: string;
}

export interface TokenServiceConfig {
  accessSecret?: string;
  refreshSecret?: string;
  accessExpiresIn?: JwtExpiresIn;
  refreshExpiresIn?: JwtExpiresIn;
}

export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: JwtExpiresIn;
  private readonly refreshExpiresIn: JwtExpiresIn;

  constructor(config?: TokenServiceConfig) {
    this.accessSecret = config?.accessSecret || process.env.JWT_ACCESS_SECRET || '';
    this.refreshSecret = config?.refreshSecret || process.env.JWT_REFRESH_SECRET || '';

    this.accessExpiresIn =
      config?.accessExpiresIn !== undefined
        ? config.accessExpiresIn
        : this.resolveExpiresIn(process.env.JWT_ACCESS_EXPIRES_IN);

    this.refreshExpiresIn =
      config?.refreshExpiresIn !== undefined
        ? config.refreshExpiresIn
        : this.resolveExpiresIn(process.env.JWT_REFRESH_EXPIRES_IN);
  }

  /**
   * Helper to resolve env string to JwtExpiresIn type safely.
   */
  private resolveExpiresIn(val: string | undefined): JwtExpiresIn {
    if (!val || val.trim() === '') {
      return undefined;
    }
    if (/^\d+$/.test(val)) {
      return parseInt(val, 10);
    }
    return val as JwtExpiresIn;
  }

  private validateAccessConfig(): void {
    if (!this.accessSecret) {
      throw new AppError('JWT_ACCESS_SECRET is not configured', 500, 'CONFIG_ERROR');
    }
    if (this.accessExpiresIn === undefined) {
      throw new AppError('JWT_ACCESS_EXPIRES_IN is not configured', 500, 'CONFIG_ERROR');
    }
  }

  private validateRefreshConfig(): void {
    if (!this.refreshSecret) {
      throw new AppError('JWT_REFRESH_SECRET is not configured', 500, 'CONFIG_ERROR');
    }
    if (this.refreshExpiresIn === undefined) {
      throw new AppError('JWT_REFRESH_EXPIRES_IN is not configured', 500, 'CONFIG_ERROR');
    }
  }

  /**
   * Generates a new JWT access token.
   */
  public generateAccessToken(payload: TokenPayload): string {
    this.validateAccessConfig();

    const options: SignOptions = {
      expiresIn: this.accessExpiresIn,
    };

    return jwt.sign(payload, this.accessSecret, options);
  }

  /**
   * Generates a new JWT refresh token.
   */
  public generateRefreshToken(payload: TokenPayload): string {
    this.validateRefreshConfig();

    const options: SignOptions = {
      expiresIn: this.refreshExpiresIn,
    };

    return jwt.sign(payload, this.refreshSecret, options);
  }

  /**
   * Generates both access token and refresh token.
   */
  public generateAuthTokens(userId: string): { accessToken: string; refreshToken: string } {
    if (!userId || userId.trim() === '') {
      throw new AppError('UserId cannot be empty', 400, 'BAD_REQUEST');
    }
    const payload: TokenPayload = { userId };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Verifies an access token and returns its payload.
   */
  public verifyAccessToken(token: string): TokenPayload {
    this.validateAccessConfig();
    if (!token || token.trim() === '') {
      throw new AppError('Token cannot be empty', 400, 'BAD_REQUEST');
    }

    try {
      const decoded = jwt.verify(token, this.accessSecret) as TokenPayload;
      if (!decoded || !decoded.userId) {
        throw new AppError('Token không hợp lệ.', 401, 'INVALID_TOKEN');
      }
      return { userId: decoded.userId };
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  /**
   * Verifies a refresh token and returns its payload.
   */
  public verifyRefreshToken(token: string): TokenPayload {
    this.validateRefreshConfig();
    if (!token || token.trim() === '') {
      throw new AppError('Token cannot be empty', 400, 'BAD_REQUEST');
    }

    try {
      const decoded = jwt.verify(token, this.refreshSecret) as TokenPayload;
      if (!decoded || !decoded.userId) {
        throw new AppError('Token không hợp lệ.', 401, 'INVALID_TOKEN');
      }
      return { userId: decoded.userId };
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  /**
   * Common JWT error handler.
   */
  private handleJwtError(error: unknown): never {
    if (error instanceof TokenExpiredError) {
      throw new AppError('Token đã hết hạn.', 401, 'TOKEN_EXPIRED');
    }
    if (error instanceof JsonWebTokenError) {
      throw new AppError('Token không hợp lệ.', 401, 'INVALID_TOKEN');
    }
    throw new AppError('Lỗi xác thực token.', 401, 'INVALID_TOKEN');
  }
}

export const tokenService = new TokenService();
