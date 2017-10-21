import { sequelize, Sequelize } from '../sequelize';

interface IUser {
  defaultRestaurant?: string;
  platform: string;
  target: string;
}

interface IUserInstance extends Sequelize.Instance<IUser>, IUser {}

interface INotification {
  daysOfTheWeek: number[];
  mealType: string;
  restaurant: string;
}

const User = sequelize.define<IUserInstance, IUser>('user', {
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

const Notification = sequelize.define<Sequelize.Instance<INotification>, INotification>('notification', {
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

User.hasMany(Notification);

export default User;
