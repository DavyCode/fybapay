// @flow

/**
 * Controllers hold request response
 * web/HTTP logic only
 * Controllers handle some basic things like validation, pulling out what data is needed
 * form the HTTP request (if you’re using Express, that’s the req object)
 * and deciding what service that data should go to.
 * And of course ultimately returning a response.
 */

import { Request, Response, NextFunction } from 'express';
import UserService from '../services/UserService';

export default {

  /**
  * Register a new user
  * @public
  */
  // async authOtpVerify(request: Request, response: Response, next: NextFunction) {
  //   const { phone } = request.body;
  //   const result = await UserService.authOtpVerify(request);
  //   return response.status(result.statusCode).send(result);
  // },

};
