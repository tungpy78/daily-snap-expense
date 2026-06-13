require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || null,
    database: process.env.DATABASE_NAME || 'dailysnap_expense',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  test: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || null,
    database: process.env.DATABASE_NAME_TEST || 'dailysnap_expense_test',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  production: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
};
