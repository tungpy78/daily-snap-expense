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
