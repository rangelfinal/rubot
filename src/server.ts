import * as bodyParser from 'body-parser';
import * as express from 'express';
import { sequelize } from './db';
import botly from './platforms/facebook/botly';
import logger from './utils/logger';

const app = express();

if (process.env.NODE_ENV !== 'production') { require('dotenv').config(); }

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.use('/botly', botly.router());

sequelize.sync().then(() => {
  app.listen(app.get('port'), () => {
    logger.info(`Node app is running on port ${app.get('port')}`);
  });
});
