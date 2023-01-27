import Userauth from '../utils/Userauth';
import { JWT_BEARER } from '../config/env';

export default async (request, response, next) => {
  if (
    request.headers &&
    request.headers.authorization &&
    request.headers.authorization.split(' ')[0] === JWT_BEARER
  ) {
    const user = await Userauth.verifyToken(request.headers.authorization);

    if (user) {
      request.user = user;
      next();
    } else {
      request.user = undefined;
      next();
    }
  } else {
    request.user = undefined;
    next();
  }
};


// var ip;
// if (req.headers['x-forwarded-for']) {
//     ip = req.headers['x-forwarded-for'].split(",")[0];
// } else if (req.connection && req.connection.remoteAddress) {
//     ip = req.connection.remoteAddress;
// } else {
//     ip = req.ip;
// }console.log("client IP is *********************" + ip);


// console.log({
//   Headers: request.headers,
//   XFORWARDED: request.headers['x-forwarded-for'],
//   remoteAddress: request.connection.remoteAddress,
// });

// const ip = (request.headers['x-forwarded-for'] || '').split(',')[0].trim();
// console.log({ ip });