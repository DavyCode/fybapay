/**
 * catch async errors with express-async-errors
 */
import 'express-async-errors';
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import expressWinston from 'express-winston';
// import LogRocket from 'logrocket';
/**
 * Requiring `winston-mongodb` will expose
 * `winston.transports.MongoDB`
 */
import 'winston-mongodb';
import {
  LOGS_DBURL,
  DBURL,
  NODE_ENV,
  CLOUDWATCH_GROUP_NAME,
  CLOUDWATCH_ACCESS_KEY,
  CLOUDWATCH_SECRET_ACCESS_KEY,
  CLOUDWATCH_REGION,
  NODE_ENV_CLOUDWATCH,
} from '../config/env';

// LogRocket.init('6ox3tp/fyba');

const logging = () => {
  /**
   * Write unhandled exception to logs/uncaughtExceptions.log file
   */
  winston.exceptions.handle(
    new winston.transports.Console({ colorize: true, prettyPrint: true }),
    new winston.transports.File({ filename: 'logs/uncaughtExceptions.log' }),
    new winston.transports.MongoDB({
      db: LOGS_DBURL,
      storeHost: true,
      tryReconnect: true,
    }),
  );

  /**
   * Exit process on unhandled promise Rejection
   */
  process.on('unhandledRejection', (ex) => {
    winston.error(ex.message, ex);
    process.exit(1);// throw ex;
  });

  winston.configure({
    transports: [
      /**
       * Logs errors to console in development
       * Logs errors to logs/error.log, DB in prod
       * Logs info to logs/logFile.log
       */
      NODE_ENV !== 'production' ? new (winston.transports.Console)({
        timestamp: new Date().toISOString(),
        colorize: true,
      }) : new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),

      new winston.transports.MongoDB({
        db: LOGS_DBURL,
        level: 'error',
        storeHost: true,
        tryReconnect: true,
      }),

      new winston.transports.File({
        filename: 'logs/logFile.log',
        level: 'info',
        format: winston.format.json(),
      }),
    ],
  });

  // winston.add(new winston.transports.File({
  //   filename: 'logs/logFile.log',
  //   level: 'info'
  // }))
  // winston.add(new winston.transports.Console())
};


const appLogger = new winston.createLogger({
  format: winston.format.json(),
  transports: [
    // new (winston.transports.Console)({
    //   timestamp: new Date().toISOString(),
    //   colorize: true,
    // }),
  ],
});

let appExpressWinston, appExpressErrorWinston;

try {
  if (NODE_ENV === 'production') {
    appLogger.add(new WinstonCloudWatch({
      logGroupName: CLOUDWATCH_GROUP_NAME,
      logStreamName: `${CLOUDWATCH_GROUP_NAME}-${NODE_ENV_CLOUDWATCH}`,
      awsAccessKeyId: CLOUDWATCH_ACCESS_KEY,
      awsSecretKey: CLOUDWATCH_SECRET_ACCESS_KEY,
      awsRegion: CLOUDWATCH_REGION,
      retentionInDays: 30,
      messageFormatter: ({ level, message, additionalInfo }) => `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`,
    }));
  }

  if (NODE_ENV === 'development') {
    appLogger.add(new (winston.transports.Console)({
      timestamp: new Date().toISOString(),
      colorize: true,
    }));
  }

  const expressCloudwatchConfig = {
    logGroupName: CLOUDWATCH_GROUP_NAME,
    logStreamName: `${CLOUDWATCH_GROUP_NAME}-${NODE_ENV_CLOUDWATCH}`,
    awsAccessKeyId: CLOUDWATCH_ACCESS_KEY,
    awsSecretKey: CLOUDWATCH_SECRET_ACCESS_KEY,
    awsRegion: CLOUDWATCH_REGION,
    retentionInDays: 30,
    // messageFormatter: ({ level, message, additionalInfo }) => `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`,
  };

  /**
   * appExpressWinston
   */
  appExpressWinston = expressWinston.logger({
    transports: [
      // new winston.transports.Console()
      new WinstonCloudWatch(expressCloudwatchConfig),
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    // msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    // msg: "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}} {{req.headers}}",
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; }, // optional: allows to skip some log messages based on request and/or response
  });

  /**
   * appExpressErrorWinston
   */
  // express-winston errorLogger makes sense AFTER the router.
  appExpressErrorWinston = expressWinston.errorLogger({
    transports: [
      // new winston.transports.Console(),
      new WinstonCloudWatch(expressCloudwatchConfig),
    ],
    msg: '{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',

    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
    ),
  });
} catch (error) {
  winston.error('Could not initiate Cloud watch connection :', error.message);
}


// let a = '/rbq/v1/pos/itex/terminal_notification';
// let b = '/rbq/v1/pos/rubies/terminal_notification';


const logResponseBody = (req, res, next) => {
  try {
    const oldWrite = res.write;
    const oldEnd = res.end;
  
    const chunks = [];
  
    res.write = (...restArgs) => {
      chunks.push(Buffer.from(restArgs[0]));
      oldWrite.apply(res, restArgs);
    };
  
    res.end = (...restArgs) => {
      if (restArgs[0]) {
        chunks.push(Buffer.from(restArgs[0]));
      }
      const body = Buffer.concat(chunks).toString('utf8');

      if (req.originalUrl !== '/rbq/v1/services') {

        // - PUT ROUTES YOU DONT WANT TO LOG HERE
        if (req.originalUrl.substring(1, 13) !== 'rbq/v1/users') {

          // todo - hide header authorization && API KEY third party from lOGs
          let head = req.headers;
          delete head.authorization;

          appLogger.log('info', `RESPONDING ${req.method} ${req.originalUrl}`, {
            tags: 'https',
            additionalInfo: {
              REQUEST: { body: req.body, headers: head, query: req.query, params: req.params },
              RESPONSE: {
                time: new Date().toUTCString(),
                fromIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                method: req.method,
                originalUri: req.originalUrl,
                uri: req.url,
                requestData: req.body,
                responseData: body,
                referer: req.headers.referer || '',
                ua: req.headers['user-agent'],
              },
            },
          });
        }
      }
  
      /**
       * @todo -- log error
       */
      oldEnd.apply(res, restArgs);
    };
  
    next();
  } catch (error) {
    winston.error('ERROR inside logResponseBody function :', error.message);
  }
};

// export default logging;
// https://medium.com/javascript-in-plain-english/set-up-a-logger-for-your-node-app-with-winston-and-cloudwatch-in-5-minutes-dec0c6c0d5b8
export { appLogger, appExpressWinston, appExpressErrorWinston, logResponseBody, logging as default };




// if (req.originalUrl !== a || req.originalUrl !== b) {
//   let head = req.headers;
//   delete head.authorization;

//   appLogger.log('info', `RESPONDING ${req.method} ${req.originalUrl}`, {
//     tags: 'https',
//     additionalInfo: {
//       REQUEST: { body: req.body, headers: head, query: req.query, params: req.params },
//       RESPONSE: {
//         time: new Date().toUTCString(),
//         fromIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//         method: req.method,
//         originalUri: req.originalUrl,
//         uri: req.url,
//         requestData: req.body,
//         responseData: body,
//         referer: req.headers.referer || '',
//         ua: req.headers['user-agent'],
//       },
//     },
//   });
// }
// else {
//   appLogger.log('info', `RESPONDING ${req.method} ${req.originalUrl}`, {
//     tags: 'https',
//     additionalInfo: {
//       REQUEST: { body: req.body, headers: req.headers, query: req.query, params: req.params },
//       RESPONSE: {
//         time: new Date().toUTCString(),
//         fromIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//         method: req.method,
//         originalUri: req.originalUrl,
//         uri: req.url,
//         requestData: req.body,
//         responseData: body,
//         referer: req.headers.referer || '',
//         ua: req.headers['user-agent'],
//       },
//     },
//   });
// }
