// @flow

import enumType from '../enumType';
import { InternalServerError } from './errors';

export default (ServiceSwitch) => {
  ServiceSwitch.find({}, (err, switchServices) => {
    if (err) { throw new InternalServerError(`Failed to seed switch service : ${err.message}`); }
    if (switchServices && switchServices.length > 0) {
      console.log('Switch Services Already exist, don\'t seed');
    } else {
      ServiceSwitch.insertMany(seed, (error, services) => {
        if (error) {
          console.log('Switch service could not be seeded');
          process.exit(1);
        }
        console.log({
          saved: services
            ? 'True: Switch seeder created'
            : 'False: Switch seeder Failed',
        });
      });
    }
  });
};

const seed = [{
  platform: enumType.platform.VTPASS,
  serviceType: enumType.serviceType.AIRTIME,
  platformToken: '',
  charges: enumType.charges.AIRTIME,
  chargesApply: false,
}, {
  platform: enumType.platform.VTPASS,
  serviceType: enumType.serviceType.DATA,
  platformToken: '',
  charges: enumType.charges.DATA,
  chargesApply: false,
}, {
  platform: enumType.platform.VTPASS,
  serviceType: enumType.serviceType.CABLETV,
  platformToken: '',
  charges: enumType.charges.CABLETV,
  chargesApply: true,
}, {
  platform: enumType.platform.VTPASS,
  serviceType: enumType.serviceType.ELECTRICITY,
  platformToken: '',
  charges: enumType.charges.ELECTRICITY,
  chargesApply: true,
}, {
  platform: enumType.platform.PRIMEAIRTIME,
  serviceType: enumType.serviceType.TRANSFER,
  platformToken: '',
  charges: enumType.charges.TRANSFER,
  chargesApply: true,
}, {
  platform: enumType.platform.GLADEPAY,
  serviceType: enumType.serviceType.BULK_TRANSFER,
  platformToken: '',
  charges: enumType.charges.BULK_TRANSFER,
  chargesApply: true,
}, {
  platform: enumType.platform.PRIMEAIRTIME,
  serviceType: enumType.serviceType.WITHDRAW,
  platformToken: '',
  charges: enumType.charges.WITHDRAW,
  chargesApply: true,
}, {
  platform: enumType.platform.ACCELEREX,
  serviceType: enumType.serviceType.POS,
  platformToken: '',
  charges: enumType.charges.POS,
  chargesApply: true,
}, {
  platform: enumType.platform.MONIFY,
  serviceType: enumType.serviceType.FUND,
  platformToken: '',
  charges: enumType.charges.FUND,
  chargesApply: true,
}, {
  platform: enumType.platform.AIRVEND,
  serviceType: enumType.serviceType.WAEC,
  platformToken: '',
  charges: enumType.charges.WAEC,
  chargesApply: true,
}, {
  platform: enumType.platform.AIRVEND,
  serviceType: enumType.serviceType.JAMB,
  platformToken: '',
  charges: enumType.charges.JAMB,
  chargesApply: true,
}, {
  platform: enumType.platform.FYBAPAY,
  serviceType: enumType.serviceType.REFUND,
  platformToken: '',
  charges: enumType.charges.REFUND,
  chargesApply: false,
}, {
  platform: enumType.platform.FYBAPAY,
  serviceType: enumType.serviceType.NULL,
  platformToken: '',
  charges: enumType.charges.NULL,
  chargesApply: false,
}, {
  platform: enumType.platform.TERMII,
  serviceType: enumType.serviceType.SMS,
  platformToken: '',
  charges: enumType.charges.NULL,
  chargesApply: false,
}, {
  platform: enumType.platform.TERMII,
  serviceType: enumType.serviceType.OTP,
  platformToken: '',
  charges: enumType.charges.NULL,
  chargesApply: false,
}, {
  platform: enumType.platform.PAYSTACK,
  serviceType: enumType.serviceType.BVN,
  platformToken: '',
  charges: enumType.charges.BVN,
  chargesApply: false,
}];
