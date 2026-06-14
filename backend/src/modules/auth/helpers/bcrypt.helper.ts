import bcrypt from 'bcrypt';

export class BcryptHelper {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hashes a plain text password using bcrypt.
   * @param password Plain text password
   * @returns Hashed password string
   */
  public static async hashPassword(password: string): Promise<string> {
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty');
    }
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares a plain text password with a bcrypt hash.
   * @param password Plain text password
   * @param passwordHash Hashed password string from database
   * @returns true if matched, false otherwise
   */
  public static async comparePassword(password: string, passwordHash: string): Promise<boolean> {
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty');
    }

    if (!passwordHash || passwordHash.trim() === '') {
      return false;
    }

    try {
      return await bcrypt.compare(password, passwordHash);
    } catch {
      // Safe fallback when hash is invalid or malformed
      return false;
    }
  }
}
