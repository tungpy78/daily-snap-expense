import { DataTypes, Model, type Optional, type NonAttribute, literal } from 'sequelize';
import sequelize from '../database/index';
import { Snap } from './snap.model';
import { Category } from './category.model';

export interface ExpenseAttributes {
  id: string;
  user_id: string;
  snap_id: string | null;
  category_id: string;
  amount: number;
  note: string | null;
  date: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type ExpenseCreationAttributes = Optional<
  ExpenseAttributes,
  'id' | 'snap_id' | 'note' | 'date' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export class Expense
  extends Model<ExpenseAttributes, ExpenseCreationAttributes>
  implements ExpenseAttributes
{
  declare id: string;
  declare user_id: string;
  declare snap_id: string | null;
  declare category_id: string;
  declare amount: number;
  declare note: string | null;
  declare date: string;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;
  declare readonly deleted_at?: Date | null;
  declare category?: NonAttribute<Category | null>;
}

Expense.init(
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
    snap_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: literal('(CURRENT_DATE)'),
    },
  },
  {
    sequelize,
    tableName: 'expenses',
    modelName: 'Expense',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
);

Expense.belongsTo(Snap, { foreignKey: 'snap_id', as: 'snap' });
Snap.hasMany(Expense, { foreignKey: 'snap_id', as: 'expenses' });
Expense.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
