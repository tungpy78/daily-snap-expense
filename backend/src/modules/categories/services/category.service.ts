import { CategoryRepository } from '../repositories/category.repository';
import type { CategoryDto } from '../dtos/category.dto';

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
}
