import { Op } from 'sequelize';
import { User } from '../../../shared/models/user.model';

export interface CreateUserData {
  username: string;
  email: string;
  passwordHash: string;
  role?: string;
  isActive?: boolean;
}

export class UserRepository {
  /**
   * Finds a user by their email address.
   */
  public static async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  /**
   * Finds a user by their username.
   */
  public static async findByUsername(username: string): Promise<User | null> {
    return User.findOne({ where: { username } });
  }

  /**
   * Finds a user by either username or email (identity).
   * Normalizes identity by trimming and converting to lowercase for consistency.
   */
  public static async findByIdentity(identity: string): Promise<User | null> {
    const normalized = identity.trim().toLowerCase();
    return User.findOne({
      where: {
        [Op.or]: [{ email: normalized }, { username: normalized }],
      },
    });
  }

  /**
   * Updates the user's last login timestamp.
   */
  public static async updateLastLogin(userId: string): Promise<void> {
    await User.update({ last_login_at: new Date() }, { where: { id: userId } });
  }

  /**
   * Creates a new user record.
   * Maps camelCase input fields to database/model snake_case attributes.
   */
  public static async create(data: CreateUserData): Promise<User> {
    const { username, email, passwordHash, role, isActive } = data;
    return User.create({
      username,
      email,
      password_hash: passwordHash,
      role: role || 'user',
      is_active: isActive !== undefined ? isActive : true,
    });
  }
}
