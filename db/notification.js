const { sequelize, Sequelize } = require('./sequelize');

const Notification = sequelize.define('notification', {
  target: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  mealType: {
    type: Sequelize.ENUM('lunch', 'dinner'),
    allowNull: false,
  },

  dayOfTheWeek: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = { Notification };
