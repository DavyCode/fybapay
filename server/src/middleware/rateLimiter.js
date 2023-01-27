import redis from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASS } from '../config/env';
import ServerResponseStatus from '../constant/ServerResponseStatus';
import { appLogger } from '../setup/logging';

const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASS,
});

redisClient.on('error', (err) => console.log(`Error ${err}`));
redisClient.on('connect', () => {
  appLogger.log('info', `REDIS CLIENT CONNECTED TO: ${redisClient.address}`);
});

export default (request, response, next) => {
  let token = request.headers['x-forwarded-for']; // get the unique identifier for the user here
  if (!token) {
    token = request.connection.remoteAddress;
  }

  if (!token) {
    return response
      .status(403)
      .send('Unidentifiable entity');
  }
  // I am using token here but it can be ip address, API_KEY, etc
  redisClient
    .multi() // starting a transaction
    .set([token, 0, 'EX', 60, 'NX']) // SET UUID 0 EX 60 NX
    .incr(token) // INCR UUID
    .exec((err, replies) => {

      if (err) {
        return response.status(500).send({
          message: err.message,
          status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
        });
      }

      if (replies[1] > 40) { // TODO : raise quota limit
        return response
          .status(429)
          .json({
            message: 'Quota Exceeded', // `Quota of ${20} request per ${60}sec exceeded`,
            status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
          });
      }
      return next();
    });
};

export const limitRouteRequest = (request, response, next) => {
  let token = request.headers['x-forwarded-for']; // get the unique identifier for the user here
  if (!token) {
    token = request.connection.remoteAddress;
  }

  if (!token) {
    return response
      .status(403)
      .send('Unidentifiable entity');
  }
  // I am using token here but it can be ip address, API_KEY, etc
  redisClient
    .multi() // starting a transaction
    .set([token, 0, 'EX', 360, 'NX']) // SET UUID 0 EX 60 NX
    .incr(token) // INCR UUID
    .exec((err, replies) => {

      if (err) {
        return response.status(500).send({
          message: err.message,
          status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
        });
      }

      if (replies[1] > 2) {
        return response
          .status(429)
          .json({
            message: 'Quota Exceeded', // `Quota of ${1} request per ${60}sec exceeded`
            status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
          });
      }
      return next();
    });
};


export const limitPaymentRequest = (request, response, next) => {
  const user = request.user; // get the unique identifier for the user here

  if (!user) {
    return response
      .status(403)
      .send('Unidentifiable entity');
  }

  const token = user.id;
  if (!token) {
    return response
      .status(403)
      .send('Unidentifiable entity');
  }

  redisClient
    .multi() // starting a transaction
    .set([token, 0, 'EX', 120, 'NX']) // SET UUID 0 EX 60 NX
    .incr(token) // INCR UUID
    .exec((err, replies) => {

    if (err) {
      return response.status(500).send({
        message: err.message,
        status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
      });
    }

    if (replies[1] > 1) {
      return response
        .status(429)
        .json({
          message: 'Quota Exceeded', // `Quota of ${1} request per ${60}sec exceeded`
          status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
        });
    }
    return next();
  });
};
