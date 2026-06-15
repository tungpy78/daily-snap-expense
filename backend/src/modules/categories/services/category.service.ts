import { CategoryRepository } from '../repositories/category.repository';
import type { CategoryDto, CreateCategoryDto } from '../dtos/category.dto';
import { AppError } from '../../../shared/utils/appError';

export class CategoryService {
  /**
   * Retrieves available categories for a user and maps them to CategoryDto objects.
   * Calculates `isDefault` based on whether `user_id` is null.
   */
  public static async getAvailableCategories(userId: string): Promise<CategoryDto[]> {
    const categories = await CategoryRepository.findAvailableForUser(userId);
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      isDefault: cat.user_id === null,
    }));
  }

  /**
   * Creates a new custom category for a user.
   * Enforces name uniqueness within the user's scope (system defaults + user custom categories).
   * Trims empty strings to null for color and icon.
   */
  public static async createCustomCategory(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    const normalizedName = dto.name.trim();

    // Check if category name is already in use by default categories or the user's custom categories
    const existing = await CategoryRepository.findAvailableByName(normalizedName, userId);
    if (existing) {
      throw new AppError('Tên danh mục đã tồn tại.', 400, 'CATEGORY_ALREADY_EXISTS');
    }

    // Normalize empty strings to null
    const color = dto.color && dto.color.trim() !== '' ? dto.color.trim() : null;
    const icon = dto.icon && dto.icon.trim() !== '' ? dto.icon.trim() : null;

    const newCat = await CategoryRepository.create({
      name: normalizedName,
      color,
      icon,
      user_id: userId,
    });

    return {
      id: newCat.id,
      name: newCat.name,
      color: newCat.color,
      icon: newCat.icon,
      isDefault: false,
    };
  }
}
