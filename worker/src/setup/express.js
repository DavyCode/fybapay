// @flow

import express from 'express';
import 'express-async-errors';
import fs from 'fs';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import fileUpload from 'express-fileupload';
// import Sentry from '@sentry/node';
import routeHandler from '../routes/index';
import { errorHandler } from '../utils/errors';
import checkHeader from './checkHeader';
import headerOptions from './headerOptions';
import { spec, swaggerOptions } from '../config/swagger';
import { NODE_ENV, SENTRY_ID, SENTRY_KEY } from '../config/env';

import VariationServices from '../services/VariationServices'


const Sentry = require('@sentry/node');

const app = express();
const router = express.Router();
const swaggerSpec = spec();

if (NODE_ENV === 'production') {
  Sentry.init({ dsn: `https://${SENTRY_KEY}@sentry.io/${SENTRY_ID}` });
}


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

/*
  Load modules
*/
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));

/**
 * HPP puts array parameters in req.query and/or req.body aside and just selects the last parameter value. You add the middleware and you are done.
 * Checking req.query may be turned off by using app.use(hpp({ checkQuery: false })).
 */
app.use(hpp()); // <- THIS IS THE NEW LINE

app.use(cors());
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

app.all('/*', checkHeader);

app.use(router);

/**
 *  error handler
 */
app.use(errorHandler);

export default app;
