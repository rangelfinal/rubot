import * as Sequelize from 'sequelize';
import logger from '../utils/logger';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: true,
  },
  logging: msg => logger.debug(msg),
  protocol: 'postgres',
});

export { Sequelize, sequelize };
