import { Op } from 'sequelize';
import sequelize from '../../../shared/database/index';
import { Category } from '../../../shared/models/category.model';
import type { CreateCategoryData } from '../dtos/category.dto';

export class CategoryRepository {
  /**
   * Finds a category by its ID.
   */
  public static async findById(id: string): Promise<Category | null> {
    return Category.findByPk(id);
  }

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

  /**
   * Finds an available category for the user by name (case-insensitive).
   * This checks both default system categories and the user's custom categories.
   */
  public static async findAvailableByName(name: string, userId: string): Promise<Category | null> {
    const normalizedName = name.trim().toLowerCase();
    return Category.findOne({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), normalizedName),
          {
            [Op.or]: [{ user_id: null }, { user_id: userId }],
          },
        ],
      },
    });
  }

  /**
   * Creates a new custom category.
   */
  public static async create(data: CreateCategoryData): Promise<Category> {
    return Category.create({
      user_id: data.user_id,
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null,
    });
  }
}
