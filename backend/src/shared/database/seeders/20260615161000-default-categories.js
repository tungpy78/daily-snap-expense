'use strict';

const defaultCategoryIds = [
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88001', // Food
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88002', // Transport
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88003', // Shopping
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88004', // Entertainment
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88005', // Study
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88006', // Health
  'ca7e1c2d-8e50-4a8b-bb57-d3da90a88007', // Other
];

const defaultCategories = [
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88001',
    user_id: null,
    name: 'Ăn uống',
    color: '#FF5733',
    icon: 'fast-food-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88002',
    user_id: null,
    name: 'Di chuyển',
    color: '#3399FF',
    icon: 'car-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88003',
    user_id: null,
    name: 'Mua sắm',
    color: '#FF3399',
    icon: 'cart-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88004',
    user_id: null,
    name: 'Giải trí',
    color: '#CC33FF',
    icon: 'game-controller-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88005',
    user_id: null,
    name: 'Học tập',
    color: '#33FF99',
    icon: 'book-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88006',
    user_id: null,
    name: 'Sức khỏe',
    color: '#FF3333',
    icon: 'heart-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'ca7e1c2d-8e50-4a8b-bb57-d3da90a88007',
    user_id: null,
    name: 'Khác',
    color: '#999999',
    icon: 'ellipsis-horizontal-outline',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Delete any existing default categories first to ensure idempotency
    await queryInterface.bulkDelete('categories', {
      id: defaultCategoryIds,
    });

    // Insert the default categories
    await queryInterface.bulkInsert('categories', defaultCategories);
  },

  down: async (queryInterface, Sequelize) => {
    // Only delete the default categories by their IDs
    await queryInterface.bulkDelete('categories', {
      id: defaultCategoryIds,
    });
  },
};
