import * as winston from 'winston';

winston.add(new winston.transports.Console({
  colorize: true,
  level: 'debug',
  prettyPrint: true,
  timestamp: true,
}));

export default winston;
