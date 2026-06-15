import { Op } from 'sequelize';
import { Snap } from '../../../shared/models/snap.model';
import { Expense } from '../../../shared/models/expense.model';
import { Category } from '../../../shared/models/category.model';
import type { CreateSnapData, TimelineQueryDto } from '../dtos/snap.dto';
import type { Transaction, WhereOptions } from 'sequelize';

export class SnapRepository {
  /**
   * Creates a new Snap record.
   * Accepts an optional transaction for atomicity.
   */
  public static async create(data: CreateSnapData, transaction?: Transaction): Promise<Snap> {
    return Snap.create(
      {
        user_id: data.user_id,
        image_url: data.image_url,
        caption: data.caption,
        is_private: data.is_private,
      },
      { transaction },
    );
  }

  /**
   * Finds and counts snaps for a user to construct their timeline,
   * including linked expenses and their categories.
   */
  public static async findTimelineByUser(
    userId: string,
    query: TimelineQueryDto,
  ): Promise<{ rows: Snap[]; count: number }> {
    const whereClause: WhereOptions = {
      user_id: userId,
    };

    if (query.startDate || query.endDate) {
      const dateFilter: Record<symbol, Date> = {};
      if (query.startDate) {
        dateFilter[Op.gte] = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        dateFilter[Op.lte] = new Date(`${query.endDate}T23:59:59.999Z`);
      }
      whereClause.created_at = dateFilter;
    }

    if (query.search) {
      whereClause.caption = {
        [Op.like]: `%${query.search}%`,
      };
    }

    return Snap.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Expense,
          as: 'expenses',
          required: false,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['name'],
            },
          ],
        },
      ],
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: query.limit,
      offset: query.offset,
      distinct: true,
    });
  }
}
