import { DataTypes, Model, type Optional, type NonAttribute } from 'sequelize';
import sequelize from '../database/index';
import { User } from './user.model';

export interface FriendshipAttributes {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: Date;
  updated_at?: Date;
}

export type FriendshipCreationAttributes = Optional<
  FriendshipAttributes,
  'id' | 'status' | 'created_at' | 'updated_at'
>;

export class Friendship
  extends Model<FriendshipAttributes, FriendshipCreationAttributes>
  implements FriendshipAttributes
{
  declare id: string;
  declare sender_id: string;
  declare receiver_id: string;
  declare status: 'pending' | 'accepted' | 'rejected';
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;

  declare sender?: NonAttribute<User>;
  declare receiver?: NonAttribute<User>;
}

Friendship.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'friendships',
    modelName: 'Friendship',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

Friendship.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Friendship.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
