// @flow

import { InternalServerError } from './errors';
import enumType from '../enumType';

export default (AppUpdate) => {
  AppUpdate.find({}, (err, appUpdates) => {
    if (err) { throw new InternalServerError(`Failed to seed AppUpdates : ${err.message}`); }
    if (appUpdates && appUpdates.length > 0) {
      console.log('appUpdates Already exist, don\'t seed');
    } else {
      AppUpdate.insertMany(seed, (error, newAppUpdates) => {
        if (error) {
          console.log('appUpdates could not be seeded');
          process.exit(1);
        }
        console.log({
          saved: newAppUpdates
            ? 'True: appUpdates seeder created'
            : 'False: appUpdates seeder Failed',
        });
      })
    }
  });
};

const seed = [{
  appType: enumType.appType.ANDROID,
  releaseDate: '2020-06-09T19:36:36.889Z',
  versionId: '101668', // unique ID
  versionNumber: '1.0.0',
  platformType: enumType.appPlatforms.MOBILE,
  redirectUrl: 'https://play.google.com/store/apps/details?id=com.fyba',
}, {
  appType: enumType.appType.IOS,
  releaseDate: '2020-06-09T19:36:36.889Z',
  versionId: '103973', // unique ID
  versionNumber: '1.0.0',
  platformType: enumType.appPlatforms.MOBILE,
  redirectUrl: 'https://play.google.com/store/apps/details?id=com.fyba',
}, {
  appType: enumType.appType.WEB,
  releaseDate: '2020-06-09T19:36:36.889Z',
  versionId: '102573', // unique ID
  versionNumber: '1.0.0',
  platformType: enumType.appPlatforms.WEB,
  redirectUrl: 'https://www.getfyba.com',
}, {
  appType: enumType.appType.SMS,
  releaseDate: '2020-06-09T19:36:36.889Z',
  versionId: '104626', // unique ID
  versionNumber: '1.0.0',
  platformType: enumType.appPlatforms.MOBILE,
  redirectUrl: 'https://www.getfyba.com',
}, {
  appType: enumType.appType.USSD,
  releaseDate: '2020-06-09T19:36:36.889Z',
  versionId: '105456', // unique ID
  versionNumber: '1.0.0',
  platformType: enumType.appPlatforms.MOBILE,
  redirectUrl: 'https://www.getfyba.com',
}, {
  appType: enumType.appType.POS,
  releaseDate: '2020-06-09T19:36:36.889Z',
  versionId: '106283', // unique ID
  versionNumber: '1.0.0',
  platformType: enumType.appPlatforms.POS,
  redirectUrl: 'https://www.getfyba.com',
}]

