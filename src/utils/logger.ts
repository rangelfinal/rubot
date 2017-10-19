import * as moment from 'moment';
import * as winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'green',
  verbose: 'white',
  debug: 'cyan',
  silly: 'magenta',
};

const consoleTransport = new winston.transports.Console({
  formatter(options) {
    // - Return string will be passed to logger.
    // - Optionally, use options.colorize(options.level, <string>) to
    //   colorize output based on the log level.
    return `(${moment().format('HH:mm:ss')} ` +
      `${winston.config.colorize(options.level, options.level.toUpperCase())}) ` +
      (options.message ? options.message : '') +
      (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
  }});

const logger = new (winston.Logger)({
  colorize: true,
  exceptionHandlers: [consoleTransport],
  level: 'debug',
  levels,
  prettyPrint: true,
  timestamp: true,
  transports: [consoleTransport],
});

winston.addColors(colors);

export default logger;
