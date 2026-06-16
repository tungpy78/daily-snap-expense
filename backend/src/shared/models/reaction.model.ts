import { DataTypes, Model, type Optional, type NonAttribute } from 'sequelize';
import sequelize from '../database/index';
import { User } from './user.model';
import { Snap } from './snap.model';

export interface ReactionAttributes {
  id: string;
  snap_id: string;
  user_id: string;
  emoji: string;
  created_at?: Date;
  updated_at?: Date;
}

export type ReactionCreationAttributes = Optional<
  ReactionAttributes,
  'id' | 'created_at' | 'updated_at'
>;

export class Reaction
  extends Model<ReactionAttributes, ReactionCreationAttributes>
  implements ReactionAttributes
{
  declare id: string;
  declare snap_id: string;
  declare user_id: string;
  declare emoji: string;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;

  declare user?: NonAttribute<User>;
  declare snap?: NonAttribute<Snap>;
}

Reaction.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    snap_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'snaps',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    emoji: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reactions',
    modelName: 'Reaction',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

Reaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Reaction.belongsTo(Snap, { foreignKey: 'snap_id', as: 'snap' });
