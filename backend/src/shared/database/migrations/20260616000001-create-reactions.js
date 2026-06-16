'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create table reactions
    await queryInterface.createTable('reactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      snap_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      emoji: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. Add foreign key constraint for snap_id
    await queryInterface.addConstraint('reactions', {
      fields: ['snap_id'],
      type: 'foreign key',
      name: 'reactions_snap_id_fk',
      references: {
        table: 'snaps',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 3. Add foreign key constraint for user_id
    await queryInterface.addConstraint('reactions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'reactions_user_id_fk',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 4. Add unique constraint (snap_id, user_id)
    await queryInterface.addIndex('reactions', ['snap_id', 'user_id'], {
      unique: true,
      name: 'reactions_snap_user_unique',
    });

    // 5. Add index user_id
    await queryInterface.addIndex('reactions', ['user_id'], {
      name: 'reactions_user_id_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reactions');
  },
};
