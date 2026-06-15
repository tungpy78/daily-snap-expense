'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create table friendships
    await queryInterface.createTable('friendships', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      receiver_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
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

    // 2. Add foreign key constraint for sender_id
    await queryInterface.addConstraint('friendships', {
      fields: ['sender_id'],
      type: 'foreign key',
      name: 'friendships_sender_id_fk',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 3. Add foreign key constraint for receiver_id
    await queryInterface.addConstraint('friendships', {
      fields: ['receiver_id'],
      type: 'foreign key',
      name: 'friendships_receiver_id_fk',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 4. Add unique constraint (sender_id, receiver_id)
    await queryInterface.addIndex('friendships', ['sender_id', 'receiver_id'], {
      unique: true,
      name: 'friendships_sender_receiver_unique',
    });

    // 5. Add index receiver_id
    await queryInterface.addIndex('friendships', ['receiver_id'], {
      name: 'friendships_receiver_id_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Drop table friendships directly (MySQL automatically drops its constraints and indexes)
    await queryInterface.dropTable('friendships');
  },
};
