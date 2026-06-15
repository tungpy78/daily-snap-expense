import { Snap } from '../../../shared/models/snap.model';
import type { CreateSnapData } from '../dtos/snap.dto';
import type { Transaction } from 'sequelize';

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
}
