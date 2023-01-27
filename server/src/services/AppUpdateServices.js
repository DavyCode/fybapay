// @flow
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import enumType, { service } from '../enumType';
import Utility from '../utils';
import AppUpdateRepository from '../repository/AppUpdateRepository';

export default {
  /**
   * admin Check app update
   * Create app update
   * admin get all app update
   * admin update app update
   */

  /**
   * createAppUpdate
   * @param {*} request
   */
  async createAppUpdate(request) {
    const appUpdate = await AppUpdateRepository.findOne({ appType: request.body.appType });
    if (appUpdate) { throw new ForbiddenError('App type already exist'); }
    const newAppUpdate = await AppUpdateRepository.appUpdateCreate({
      ...request.body,
    });

    if (!newAppUpdate) {
      throw new InternalServerError('Could not create app update');
    }
    return Utility.buildResponse({ data: newAppUpdate, message: 'New app update created' });
  },

  /**
   * checkAppUpdate
   * @param {*} request
   */
  async checkAppUpdate(request) {
    const appUpdate = await AppUpdateRepository.findOne({
      appType: request.query.appType,
    });

    if (!appUpdate) { throw new NotFoundError('App update not found'); }
    return Utility.buildResponse({ data: appUpdate });
  },

  /**
   * getAllAppUpdates
   * @param {*} request
   */
  async getAllAppUpdates(request) {
    const appUpdates = await AppUpdateRepository.getAllAppUpdates(request.query);
    if (!appUpdates.data) { throw new NotFoundError('App update not found'); }
    return Utility.buildResponse({ ...appUpdates });
  },

  /**
   * updateAppUpdate
   * @param {*} request
   */
  async updateAppUpdate(request) {
    const { appUpdateId } = request.body;
    delete request.body.appUpdateId;

    const appUpdate = await AppUpdateRepository.appUpdateInsert({ _id: appUpdateId }, {
      ...request.body,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    if (!appUpdate) { throw new NotFoundError('App update not updated'); }

    return Utility.buildResponse({ data: appUpdate, message: 'Update successfully' });
  },

  /**
   * getAppPlatformsAndTypes
   * @param {*} request
   */
  async getAppPlatformsAndTypes(request) {
    return Utility.buildResponse({
      data: {
        appType: [...Utility.getObjectValues(enumType.appType)],
        appPlatforms: [...Utility.getObjectValues(enumType.appPlatforms)],
      },
    });
  },
};
