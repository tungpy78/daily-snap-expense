'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create table snaps
    await queryInterface.createTable('snaps', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 2. Add index 'snaps_user_id_created_at_index'
    await queryInterface.addIndex('snaps', ['user_id', 'created_at'], {
      name: 'snaps_user_id_created_at_index',
    });

    // 3. Clear existing snap_id values from expenses before adding constraints
    await queryInterface.sequelize.query(
      'UPDATE expenses SET snap_id = NULL WHERE snap_id IS NOT NULL;',
    );

    // 4. Add constraint 'expenses_snap_id_fk'
    await queryInterface.addConstraint('expenses', {
      fields: ['snap_id'],
      type: 'foreign key',
      name: 'expenses_snap_id_fk',
      references: {
        table: 'snaps',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Check if constraint 'expenses_snap_id_fk' exists before trying to remove it
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'expenses'
        AND CONSTRAINT_NAME = 'expenses_snap_id_fk'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);

    if (constraints.length > 0) {
      await queryInterface.removeConstraint('expenses', 'expenses_snap_id_fk');
    }

    // 2. Drop snaps table (MySQL will drop snaps_user_id_created_at_index automatically)
    await queryInterface.dropTable('snaps');
  },
};
