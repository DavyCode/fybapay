// @flow

import models from '../models';

export default {
  /**
   * findById
   * @param {*} id 
   */
  async findById(id: string) {
    return await models.User.findById(id);
  },
}