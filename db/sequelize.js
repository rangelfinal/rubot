const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: true,
  dialectOptions: {
    ssl: true,
  },
});

module.exports = { Sequelize, sequelize };
