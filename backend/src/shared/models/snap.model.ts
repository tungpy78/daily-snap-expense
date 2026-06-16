import { DataTypes, Model, type Optional, type NonAttribute } from 'sequelize';
import sequelize from '../database/index';
import { User } from './user.model';
import type { Expense } from './expense.model';

export interface SnapAttributes {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  is_private: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type SnapCreationAttributes = Optional<
  SnapAttributes,
  'id' | 'caption' | 'is_private' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export class Snap extends Model<SnapAttributes, SnapCreationAttributes> implements SnapAttributes {
  declare id: string;
  declare user_id: string;
  declare image_url: string;
  declare caption: string | null;
  declare is_private: boolean;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
  declare readonly deleted_at?: Date | null;
  declare expenses?: NonAttribute<Expense[]>;
  declare user?: NonAttribute<User>;
}

Snap.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'snaps',
    modelName: 'Snap',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
);

Snap.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Snap, { foreignKey: 'user_id', as: 'snaps' });
