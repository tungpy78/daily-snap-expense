import { Sequelize, Dialect } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

const dbUser = process.env.DATABASE_USER || 'root';
const dbPassword = process.env.DATABASE_PASSWORD || undefined;
const dbName = process.env.DATABASE_NAME || 'dailysnap_expense';
const dbHost = process.env.DATABASE_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DATABASE_PORT || '3306', 10);
const dbDialect = (process.env.DATABASE_DIALECT || 'mysql') as Dialect;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
  logging: env === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

export default sequelize;
