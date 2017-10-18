const { sequelize, Sequelize } = require('./sequelize');
const { Notification } = require('./notification');
const redis = require('./redis');

module.exports = {
  Notification, sequelize, Sequelize, redis,
};
