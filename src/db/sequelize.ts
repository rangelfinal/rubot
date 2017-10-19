import * as Sequelize from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: true,
  },
  logging: true,
  protocol: 'postgres',
});

export { Sequelize, sequelize };
