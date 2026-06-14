import { BcryptHelper } from './bcrypt.helper';

describe('BcryptHelper', () => {
  const plainPassword = 'mySecurePassword123';

  describe('hashPassword', () => {
    it('should return hashed password as a string', async () => {
      const hash = await BcryptHelper.hashPassword(plainPassword);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should not return the plain password itself', async () => {
      const hash = await BcryptHelper.hashPassword(plainPassword);
      expect(hash).not.toBe(plainPassword);
    });

    it('should generate different hashes for the same password due to random salt', async () => {
      const hash1 = await BcryptHelper.hashPassword(plainPassword);
      const hash2 = await BcryptHelper.hashPassword(plainPassword);
      expect(hash1).not.toBe(hash2);
    });

    it('should throw an error if the password is empty or only whitespace', async () => {
      await expect(BcryptHelper.hashPassword('')).rejects.toThrow('Password cannot be empty');
      await expect(BcryptHelper.hashPassword('   ')).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('comparePassword', () => {
    let hashedPassword = '';

    beforeAll(async () => {
      hashedPassword = await BcryptHelper.hashPassword(plainPassword);
    });

    it('should return true for correct password match', async () => {
      const isMatch = await BcryptHelper.comparePassword(plainPassword, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password match', async () => {
      const isMatch = await BcryptHelper.comparePassword('wrongPassword', hashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should throw an error if the input password is empty', async () => {
      await expect(BcryptHelper.comparePassword('', hashedPassword)).rejects.toThrow(
        'Password cannot be empty',
      );
      await expect(BcryptHelper.comparePassword('   ', hashedPassword)).rejects.toThrow(
        'Password cannot be empty',
      );
    });

    it('should return false safely if the password hash is empty', async () => {
      const isMatch = await BcryptHelper.comparePassword(plainPassword, '');
      expect(isMatch).toBe(false);
    });

    it('should return false safely if the password hash is invalid or malformed', async () => {
      const isMatch = await BcryptHelper.comparePassword(plainPassword, 'invalid_hash_string');
      expect(isMatch).toBe(false);
    });
  });
});
