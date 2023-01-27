// @flow

import uuidv1 from 'uuid/v1';
const crypto = require('crypto');
import ServerResponseStatus from '../constant/ServerResponseStatus';

/**
 * Random number generator
 */
exports.getRandomInteger = (min: number = 0, max: number = Number.MAX_SAFE_INTEGER) => {
  return Math.floor(Math.random() * max + min);
}

/**
 * Generate unique ID
 */
exports.genUniqueId = () => uuidv1()

/**
 * Build api response
 */
exports.buildResponse = (response: {}) => {
  return { 
    ...response,
    status: ServerResponseStatus.RESPONSE_STATUS_SUCCESS,
    statusCode: ServerResponseStatus.OK,
  };
}

/**
 * Build Failed response
 */
exports.buildFailedResponse = (response: {}) => {
  return { 
    ...response,
    status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
    statusCode: ServerResponseStatus.FAILED,
  };
}

/**
 * Build Failed response
 */
exports.buildBadRequestResponse = (response: {}) => {
  return { 
    ...response,
    status: ServerResponseStatus.RESPONSE_STATUS_FAILURE,
    statusCode: ServerResponseStatus.BAD_REQUEST,
  };
}

/**
 * Generate timestamp
 */
exports.genTimeStamp = (x: number, y: number, z?: number = 1) => Date.now() + 1000 * x * y * z;

/**
 * Get object values
 */
exports.getObjectValues = (object: {} = {}): Array<mixed> => Object.values(object);

/**
 * Get object keys
 */
exports.getObjectKeys = (object: {} = {}): Array<mixed> =>  Object.keys(object);

/**
 * Generate Transaction Reference
 */
exports.generateTrxReference = async () => {
  const hash = crypto.randomBytes(256);
  const randomChar = await crypto.createHmac('sha256', hash).digest('hex');
  let ref = 'FB|';
  let time = new Date(new Date());

  for (let i = 0; i < 5; i++) {
    let a = randomChar.charAt(Math.floor(Math.random() * randomChar.length));
    ref += a;
  }
  
  ref += `|${time.getFullYear()}|${time.getMonth() +1}|${time.getDate()}|${time.toTimeString().split(':')[0]}`
  return ref
};

/**
 * escapeRegex
 */
// exports.escapeRegex = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
exports.escapeRegex = (text: string) => {
  if (!text || typeof text !== 'string') {
    return false
  }
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}