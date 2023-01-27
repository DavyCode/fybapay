import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRATION_MINUTES } from '../config/env';

export default {
  /**
   *  Generate Token
   * @param {object} user
   * @type object
   * @return token
   */
  async generateToken(user) {
    const token = await jwt.sign(
      {
        id: user.id,
        role: user.role,
        userId: user.userId,
        iat: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION_MINUTES }, // '1hr'
      { algorithm: 'HS512' },
    );
    return token;
  },

  /**
   *  Verify Token
   * @param {string} accessToken
   * @type string
   * @return user object
   */
  async verifyToken(accessToken) {
    const token = accessToken.split(' ')[1];
    if (token) {
      try {
        const decode = await jwt.verify(token, JWT_SECRET);
        return decode;
      } catch (err) {
        return undefined;
      }
    } else {
      return undefined;
    }
  },

};
