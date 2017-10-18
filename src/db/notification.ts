import { sequelize, Sequelize } from './sequelize';

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

export default Notification;
