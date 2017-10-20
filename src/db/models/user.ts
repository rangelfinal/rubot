import { sequelize, Sequelize } from '../sequelize';

const user = sequelize.define('user', {
  defaultRestaurant: {
    type: Sequelize.STRING,
  },

  platform: {
    allowNull: false,
    type: Sequelize.STRING,
  },

  target: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
});

const notification = sequelize.define('notification', {
  daysOfTheWeek: {
    type: Sequelize.ARRAY(Sequelize.INTEGER),
  },

  mealType: {
    type: Sequelize.STRING,
  },

  restaurant: {
    type: Sequelize.STRING,
  },
});

user.hasMany(notification);

export default user;
