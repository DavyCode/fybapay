import Userauth from "../utils/Userauth";
import { JWT_BEARER } from "../config/env";

export default async (request, response, next) => {
  if (
    request.headers &&
    request.headers.access_token &&
    request.headers.access_token.split(" ")[0] === JWT_BEARER
  ) {
    const user = await Userauth.verifyToken(request.headers.access_token);
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
