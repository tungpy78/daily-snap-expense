import sequelize from '../../../shared/database/index';
import { SnapRepository } from '../repositories/snap.repository';
import { ExpenseService } from '../../expenses/services/expense.service';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { LocalStorageProvider } from '../../../shared/storage/local-storage.provider';
import { AppError } from '../../../shared/utils/appError';
import type { CreateSnapDto, CreateSnapResponseDto } from '../dtos/snap.dto';

export class SnapService {
  /**
   * Creates a Snap and any linked expenses inside a database transaction.
   * If any step fails, the transaction is rolled back and the uploaded image is deleted.
   */
  public static async createSnap(
    userId: string,
    file: Express.Multer.File,
    dto: CreateSnapDto,
  ): Promise<CreateSnapResponseDto> {
    // 1. Pre-validate category ownership of expenses before uploading image to minimize orphan files
    if (dto.expenses && dto.expenses.length > 0) {
      for (const expense of dto.expenses) {
        const category = await CategoryRepository.findById(expense.categoryId);
        if (!category) {
          throw new AppError('Danh mục không tồn tại.', 400, 'CATEGORY_NOT_FOUND');
        }
        if (category.user_id !== null && category.user_id !== userId) {
          throw new AppError('Bạn không có quyền sử dụng danh mục này.', 403, 'FORBIDDEN');
        }
      }
    }

    const storageProvider = new LocalStorageProvider();
    let uploadedImageUrl: string | null = null;
    let transaction = null;

    try {
      // 2. Upload snap image to static server folder snaps
      uploadedImageUrl = await storageProvider.uploadImage(file, 'snaps');

      // 3. Begin database transaction
      transaction = await sequelize.transaction();

      // 4. Save snap to database
      const snap = await SnapRepository.create(
        {
          user_id: userId,
          image_url: uploadedImageUrl,
          caption: dto.caption || null,
          is_private: dto.isPrivate,
        },
        transaction,
      );

      // 5. Save associated expenses to database
      const createdExpenses = [];
      if (dto.expenses && dto.expenses.length > 0) {
        for (const expenseDto of dto.expenses) {
          const expense = await ExpenseService.createManualExpense(
            userId,
            {
              amount: expenseDto.amount,
              categoryId: expenseDto.categoryId,
              note: expenseDto.note,
              date: expenseDto.date,
              snapId: snap.id, // Relate to created snap
            },
            transaction,
          );
          createdExpenses.push({
            id: expense.id,
            amount: expense.amount,
            categoryId: expense.categoryId,
            note: expense.note,
            date: expense.date,
          });
        }
      }

      // 6. Commit transaction
      await transaction.commit();

      // 7. Map to DTO format
      return {
        snap: {
          id: snap.id,
          imageUrl: snap.image_url,
          caption: snap.caption,
          isPrivate: snap.is_private,
          createdAt: snap.created_at ? snap.created_at.toISOString() : new Date().toISOString(),
        },
        expenses: createdExpenses,
      };
    } catch (error) {
      // Rollback database changes if active
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('[Database] Failed to rollback transaction:', rollbackError);
        }
      }

      // Cleanup uploaded image from disk if created
      if (uploadedImageUrl) {
        try {
          await storageProvider.deleteImage(uploadedImageUrl);
        } catch (cleanupError) {
          console.error(
            `[Storage] Failed to cleanup uploaded image at ${uploadedImageUrl}:`,
            cleanupError,
          );
        }
      }

      // Re-throw the exact error
      throw error;
    }
  }
}
