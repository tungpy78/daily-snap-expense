import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../database/index';

export interface CategoryAttributes {
  id: string;
  user_id: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type CategoryCreationAttributes = Optional<
  CategoryAttributes,
  'id' | 'created_at' | 'updated_at'
>;

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare color: string | null;
  declare icon: string | null;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
