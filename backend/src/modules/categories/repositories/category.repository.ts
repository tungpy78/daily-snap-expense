import { Op } from 'sequelize';
import { Category } from '../../../shared/models/category.model';

export class CategoryRepository {
  /**
   * Retrieves all categories available to a user.
   * This includes system/default categories (user_id IS NULL) and the user's custom categories.
   */
  public static async findAvailableForUser(userId: string): Promise<Category[]> {
    return Category.findAll({
      where: {
        [Op.or]: [{ user_id: null }, { user_id: userId }],
      },
      order: [
        ['user_id', 'ASC'], // NULL (system default categories) will sort first
        ['name', 'ASC'], // Secondary sort by category name for stability
      ],
    });
  }
}
