const express = require('express');
const bodyParser = require('body-parser');
const botRouter = require('./bot/router');
const { sequelize } = require('./db');

const app = express();

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.use('/', botRouter);

sequelize.sync().then(() => {
  app.listen(app.get('port'), () => {
    console.log('Node app is running on port', app.get('port'));
  });
});
