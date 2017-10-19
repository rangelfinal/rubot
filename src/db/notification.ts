import { sequelize, Sequelize } from './sequelize';

const notification = sequelize.define('notification', {
  dayOfTheWeek: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },

  mealType: {
    allowNull: false,
    type: Sequelize.ENUM('lunch', 'dinner'),
  },

  target: {
    allowNull: false,
    type: Sequelize.STRING,
  },
});

export default notification;
