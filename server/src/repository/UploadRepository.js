// @flow

import { User } from '../models/'

export default {
  /**
  * Insert upload
  * @private
  */
  async insert(query: {}, update: {}, option: {}) {
    return await User.findOneAndUpdate(query, update, option);
  }
} 