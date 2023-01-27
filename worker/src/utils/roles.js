// @flow

import { AccessControl } from 'accesscontrol';
import { rolesType } from '../enumType';

const ac = new AccessControl();

export default (() => {
  ac.grant(rolesType.USER)
    .readOwn('user')
    .updateOwn('user')
    .readAny('Wallet')
    .updateOwn('Wallet')
    .readOwn('Transaction')
    .createAny('Transaction')
    .readOwn('CommissionWallet')
    .readOwn('CommissionHistory')
    .createOwn('CommissionHistory')

  ac.grant(rolesType.AGENT)
    .extend(rolesType.USER)

  ac.grant(rolesType.SUPERAGENT)
    .extend(rolesType.USER)
    .extend(rolesType.AGENT)

  ac.grant(rolesType.SUPPORT)
    .extend(rolesType.USER)
    .readAny('user')
    .readAny('user')
    .updateAny('user')
    .createAny('user')
    .readAny('Wallet')
    .readAny('ServiceSwitch')
    .readAny('Transaction')
    .readAny('CommissionWallet')
    .readAny('CommissionHistory')

  ac.grant(rolesType.ADMIN)
    .extend(rolesType.SUPPORT)
    .updateAny('Wallet')
    .updateAny('ServiceSwitch')
    .updateAny('Transaction')
    .updateAny('CommissionWallet')
    .updateAny('CommissionHistory')
    .readAny('ServiceSwitchLog')
    
  ac.grant(rolesType.SUPERADMIN)
    .extend(rolesType.USER)
    .extend(rolesType.ADMIN)
    .createAny('ServiceSwitch')
    .deleteAny('user')
    .deleteAny('Wallet')
    .deleteAny('Transaction')

  return ac;
})();
