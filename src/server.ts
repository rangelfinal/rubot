import express from 'express';
import bodyParser from 'body-parser';
import botRouter from './bot/router';
import { sequelize } from './db';

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
