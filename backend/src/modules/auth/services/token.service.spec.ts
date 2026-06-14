import { TokenService } from './token.service';

describe('TokenService', () => {
  const userId = 'user-uuid-123';
  const accessSecret = 'test_access_secret';
  const refreshSecret = 'test_refresh_secret';
  const accessExpiresIn = '15m';
  const refreshExpiresIn = '7d';

  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService({
      accessSecret,
      refreshSecret,
      accessExpiresIn,
      refreshExpiresIn,
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token as a string', () => {
      const token = tokenService.generateAccessToken({ userId });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should throw CONFIG_ERROR if access secret is missing', () => {
      const badService = new TokenService({
        accessSecret: '',
        accessExpiresIn,
      });
      expect(() => badService.generateAccessToken({ userId })).toThrow(
        expect.objectContaining({
          code: 'CONFIG_ERROR',
          statusCode: 500,
        }),
      );
    });

    it('should throw CONFIG_ERROR if access expiresIn is missing', () => {
      const badService = new TokenService({
        accessSecret,
        accessExpiresIn: undefined,
      });
      expect(() => badService.generateAccessToken({ userId })).toThrow(
        expect.objectContaining({
          code: 'CONFIG_ERROR',
          statusCode: 500,
        }),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token as a string', () => {
      const token = tokenService.generateRefreshToken({ userId });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should throw CONFIG_ERROR if refresh secret is missing', () => {
      const badService = new TokenService({
        refreshSecret: '',
        refreshExpiresIn,
      });
      expect(() => badService.generateRefreshToken({ userId })).toThrow(
        expect.objectContaining({
          code: 'CONFIG_ERROR',
          statusCode: 500,
        }),
      );
    });
  });

  describe('generateAuthTokens', () => {
    it('should return both accessToken and refreshToken', () => {
      const tokens = tokenService.generateAuthTokens(userId);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should throw BAD_REQUEST if userId is empty', () => {
      expect(() => tokenService.generateAuthTokens('')).toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          statusCode: 400,
        }),
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token and return the correct userId', () => {
      const token = tokenService.generateAccessToken({ userId });
      const payload = tokenService.verifyAccessToken(token);
      expect(payload).toEqual({ userId });
    });

    it('should throw INVALID_TOKEN when verify fails (e.g. wrong secret)', () => {
      const anotherService = new TokenService({
        accessSecret: 'another_secret',
        accessExpiresIn,
      });
      const token = anotherService.generateAccessToken({ userId });
      expect(() => tokenService.verifyAccessToken(token)).toThrow(
        expect.objectContaining({
          code: 'INVALID_TOKEN',
          statusCode: 401,
          message: 'Token không hợp lệ.',
        }),
      );
    });

    it('should throw TOKEN_EXPIRED when token is expired using fake timers', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 5, 14, 12, 0, 0)); // Set fixed time

      const token = tokenService.generateAccessToken({ userId });

      // Move system time forward by 20 minutes (expiresIn is 15m)
      jest.setSystemTime(new Date(2026, 5, 14, 12, 20, 0));

      expect(() => tokenService.verifyAccessToken(token)).toThrow(
        expect.objectContaining({
          code: 'TOKEN_EXPIRED',
          statusCode: 401,
          message: 'Token đã hết hạn.',
        }),
      );

      jest.useRealTimers();
    });

    it('should throw INVALID_TOKEN when token is malformed', () => {
      expect(() => tokenService.verifyAccessToken('not.a.valid.token')).toThrow(
        expect.objectContaining({
          code: 'INVALID_TOKEN',
          statusCode: 401,
        }),
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token and return the correct userId', () => {
      const token = tokenService.generateRefreshToken({ userId });
      const payload = tokenService.verifyRefreshToken(token);
      expect(payload).toEqual({ userId });
    });

    it('should throw INVALID_TOKEN when verify fails (e.g. using access token with refresh verify)', () => {
      const token = tokenService.generateAccessToken({ userId });
      expect(() => tokenService.verifyRefreshToken(token)).toThrow(
        expect.objectContaining({
          code: 'INVALID_TOKEN',
          statusCode: 401,
        }),
      );
    });

    it('should throw TOKEN_EXPIRED when refresh token is expired using fake timers', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 5, 14, 12, 0, 0));

      const token = tokenService.generateRefreshToken({ userId });

      // Move system time forward by 8 days (expiresIn is 7d)
      jest.setSystemTime(new Date(2026, 5, 22, 12, 0, 0));

      expect(() => tokenService.verifyRefreshToken(token)).toThrow(
        expect.objectContaining({
          code: 'TOKEN_EXPIRED',
          statusCode: 401,
        }),
      );

      jest.useRealTimers();
    });
  });
});
