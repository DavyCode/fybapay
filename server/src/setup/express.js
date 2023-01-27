// @flow

import express from 'express';
/**
 * catch async errors with express-async-errors
 */
import 'express-async-errors';
import fs from 'fs';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import fileUpload from 'express-fileupload';

// import Sentry from '@sentry/node';
import routeHandler from '../routes/index';
import { errorHandler } from '../utils/errors';
import checkHeader from './checkHeader';
import { appLogger, appExpressWinston, appExpressErrorWinston, logResponseBody } from './logging';
import headerOptions from './headerOptions';
import { spec, swaggerOptions } from '../config/swagger';
import { NODE_ENV, SENTRY_ID, SENTRY_KEY } from '../config/env';
import rateLimiter from '../middleware/rateLimiter';

const Sentry = require('@sentry/node');

const app = express();
const router = express.Router();
const swaggerSpec = spec();

if (NODE_ENV === 'production') {
  Sentry.init({ dsn: `https://${SENTRY_KEY}@sentry.io/${SENTRY_ID}` });
}

/*
  Load modules
*/
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));
// app.use(logger('dev'));

/**
 * Log incoming request
 */
if (process.env.NODE_ENV !== 'production') {
  app.use(logger('dev')); // short ,tiny, and dev, combined
} else {
  try {
    const accessLogStream = fs.createWriteStream('./logger/access.log', { flags: 'a' });
    // app.use(logger('combined', { stream: accessLogStream }));
    app.use(logger('{"remote_addr": ":remote-addr", "remote_user": ":remote-user", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time"}', {
      stream: accessLogStream,
    }));
  } catch (error) {
    console.log(error);
  }
}

/**
 * Log incoming request/response to cloudwatch
 */
app.use(logResponseBody);


/**
 * HPP puts array parameters in req.query and/or req.body aside and just selects the last parameter value. You add the middleware and you are done.
 * Checking req.query may be turned off by using app.use(hpp({ checkQuery: false })).
 */
app.use(hpp()); // <- THIS IS THE NEW LINE

app.use(cors());
/**
 * req.ip and req.protocol are now set to ip and protocol of the client, not the ip and protocol of the reverse proxy server       req.headers['x-forwarded-for'] is not changed
  req.headers['x-forwarded-for'] contains more than 1 forwarder when
  there are more forwarders between the client and nodejs.
  Forwarders can also be spoofed by the client, but
  app.set('trust proxy') selects the correct client ip from the list
  if the nodejs server is called directly, bypassing the trusted proxies,
  then 'trust proxy' ignores x-forwarded-for headers and
  sets req.ip to the remote client ip address
  app.enable('trust proxy');
 * only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
 */
app.enable('trust proxy');

/**
 * If you don’t want to use Helmet, then at least disable the X-Powered-By header
 * Attackers can use this header (which is enabled by default) to detect apps running Express and then launch specifically-targeted attacks.
 */
// app.disable('x-powered-by'); // If you use helmet.js, it takes care of this for you.
app.use(helmet());


// To remove data, use:
/**
 * Add as a piece of express middleware, before defining your routes.
 * sanitizes user-supplied data to prevent MongoDB Operator Injection.
 * Or, to replace prohibited characters with _, use: app.use(mongoSanitize({ replaceWith: '_' }))
 */
app.use(mongoSanitize());

// Prevent XSS attacks
/* make sure this comes before any routes */
app.use(xss());


/**
 * express-winston provides middlewares for request and error logging of your express.js 
 * application. It uses 'whitelists' to select properties from the request and (new in 0.2.x) response objects.
 */
// app.use(appExpressWinston);

/**
 * Load routes
 */
routeHandler(router);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions),
);

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerSpec);
});

app.use(fileUpload({
  safeFileNames: true,
  limits: { fileSize: 50 * 1024 },
  useTempFiles: true,
}));
/**
 * Header options
 */
app.use(headerOptions);

app.all('/*', checkHeader, rateLimiter);

app.use(router);

// express-winston errorLogger makes sense AFTER the router.
// app.use(appExpressErrorWinston);

/**
 *  error handler
 */
app.use(errorHandler);

// VariationServices.getPrimeAirtimeToken();

export default app;
