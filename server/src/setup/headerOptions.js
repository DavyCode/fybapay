/**
 * Request headers
 */
export default async (request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  response.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  // response.header('Access-Control-Max-Age', 600);
  /**
   * Cache-Control
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
   */
  response.header('Content-Type', 'application/json');
  response.header('Connection', 'keep-alive');
  response.header('Keep-Alive', 'timeout=200');
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  } else {
    next();
  }
};
