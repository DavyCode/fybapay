// @flow

import enumType from '../enumType';
import { InternalServerError } from './errors';

export default (Platform) => {
  Platform.find({}, (err, platforms) => {
    if (err) { throw new InternalServerError(`Failed to seed platforms : ${err.message}`); }
    if (platforms && platforms.length > 0) {
      console.log('platforms Already exist, don\'t seed');
    } else {
      Platform.insertMany(seed, (error, newPlatforms) => {
        if (error) {
          console.log('platform could not be seeded');
          process.exit(1);
        }
        console.log({
          saved: newPlatforms
            ? 'True: Platform seeder created'
            : 'False: Platform seeder Failed',
        });
      });
    }
  });
};

const seed = [{
  platform: enumType.platform.FYBAPAY,
  platformToken: '',
}, {
  platform: enumType.platform.AIRVEND,
  platformToken: '',
}, {
  platform: enumType.platform.GLADEPAY,
  platformToken: '',
}, {
  platform: enumType.platform.VTPASS,
  platformToken: '',
}, {
  platform: enumType.platform.CARBON,
  platformToken: '',
}, {
  platform: enumType.platform.MONIFY,
  platformToken: '',
}, {
  platform: enumType.platform.ACCELEREX,
  platformToken: '',
}, {
  platform: enumType.platform.IRECHARGE,
  platformToken: '',
}, {
  platform: enumType.platform.PROVIDOUS,
  platformToken: '',
}, {
  platform: enumType.platform.PRIMEAIRTIME,
  platformToken: '',
}, {
  platform: enumType.platform.BULKSMSNIGERIA,
  platformToken: '',
}, {
  platform: enumType.platform.ESTORESMS,
  platformToken: '',
}, {
  platform: enumType.platform.SMARTSOLUTIONS,
  platformToken: '',
}, {
  platform: enumType.platform.MULTITEXTER,
  platformToken: '',
}, {
  platform: enumType.platform.OPAY,
  platformToken: '',
}, {
  platform: enumType.platform.RUBIES,
  platformToken: '',
}, {
  platform: enumType.platform.ITEX,
  platformToken: '',
}, {
  platform: enumType.platform.TERMII,
  platformToken: '',
}, {
  platform: enumType.platform.PAYSTACK,
  platformToken: '',
}, {
  platform: enumType.platform.FLUTTERWAVE,
  platformToken: '',
}, {
  platform: enumType.platform.WEMA,
  platformToken: '',
}, {
  platform: enumType.platform.HERITAGE,
  platformToken: '',
}];
