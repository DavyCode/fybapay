// @flow

import UserRepository from '../repository/UserRepository';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository'
import WalletRepository from '../repository/WalletRepository'
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';
import ServicesHelper from '../helpers/ServicesHelper'
import Pubsub from '../events';
import enumType from '../enumType';
import VariationServices from './VariationServices';
import DateUtil from '../utils/dateUtil';


export default {
  /**
   * SERVICES
   * addUser
   * deleteUser
   * getUserByRole
   * lockUserAccount
   * getAllUsers
   * getInsight
   * sendAppUpdateNotification
   * serviceSwitch
   * getServices
   * updateUserWalletLimit
   */

  /**
  * Add User
  * @private
  */
  async addUser () {

  },

  /**
  * Delete User
  * @private
  */
  async deleteUser () {},

  /**
  * Get User By Role
  * @private
  */
  async getUserByRole () {},
    
  /**
  * Lock User Account
  * @private
  */
  async lockUserAccount (request) {    
    const user = await UserRepository.userInsert({_id: request.body.userId}, {
      lock: true,
      active: false,
      'meta.updatedAt': Date.now(), // DateUtil(),
    }, { new: true, upsert: false });

    if (!user) { throw new NotFoundError('User not found'); }
    return Utility.buildResponse({ data: user, message: 'User locked'})
  },

  /**
  * UnLock User Account
  * @private
  */
  async unlockUserAccount (request) {    
    const user = await UserRepository.userInsert({_id: request.body.userId}, {
      lock: false,
      active: true,
      'meta.updatedAt': Date.now(), // DateUtil(),
    }, { new: true, upsert: false });

    if (!user) { throw new NotFoundError('User not found'); }
    return Utility.buildResponse({ data: user, message: 'User unlocked'})
  },

  /**
  * Update User Wallet Limit
  * @private
  */
  async updateUserWalletLimit(request) {    
    const wallet = await WalletRepository.insertWallet({ user: request.body.userId }, {
      limit: parseInt(request.body.amount, 10),
      'meta.updatedAt': Date.now(), // DateUtil(),
    }, { new: true, upsert: false})
    if (!wallet) { throw new NotFoundError('User wallet not found'); }
    return Utility.buildResponse({ data: wallet, message: 'Wallet limit updated' });
  },

  /**
   * Assign user role
   * @private
   */
  async assignUserRole(request) {
    if (!Object.values(enumType.rolesType).includes(request.body.role)) { throw new BadRequestError('User role not acceptable') }
    const user = await UserRepository.userInsert({_id: request.body.userId }, {
      role: String(request.body.role),
      'meta.updatedAt': Date.now(), // DateUtil(),
    }, { new: true, upsert: false });

    if (!user) { throw new NotFoundError('User not found'); }
    return Utility.buildResponse({ data: user, message: 'User role updated' })
  },

  /**
   * TODO
  * Get Insight
  * @private
  */
  async getInsight () {
    

   
  },

  /**
   * TODO
   */
  async getUserTotals () {
    // setTotalAdmin
    // setTotalAgent
    // setTotalSupport
    // setTotalUser
  },

  /**
   * TODO
  * Send App Update Notification
  * @private
  */
  async sendAppUpdateNotification () {},

  /**
  *  Switch Current Service
  * @private
  */
  async updateServiceChargeAndPlatform (request: any) {
    const { serviceType, platform, charge } = request.body;
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };
    
    /**
     * check for platforms that require token to operate
     * fetch token for service
     */
    let token = '';

    if (platform === enumType.platform.PRIMEAIRTIME) {
      let result = await VariationServices.getPlatformToken(enumType.platform.PRIMEAIRTIME);
      if (!result) {
        await VariationServices.getPrimeAirtimeToken();
        result = await VariationServices.getPlatformToken(enumType.platform.PRIMEAIRTIME);
        token = result;
      }
      else {
        token = result;
      }
    }

    const serviceSwitch = await ServiceSwitchRepository.insertService({serviceType}, {
      platform,
      charges: charge,
      platformToken: token,
      'meta.updatedAt': Date.now(), // DateUtil(),
    }, { new: true, upsert: false });
    
    if (!serviceSwitch) { throw new NotFoundError('Service not found') };
    
    await ServiceSwitchRepository.createSwitchLog({
      charges: charge,
      platform,
      serviceType,
      logMessage: `Switched ${serviceType} service platform to ${platform} and charges ${charge}`,
      user: request.user.id,
      switchService: serviceSwitch._id,
      'meta.updatedAt': Date.now(), // DateUtil(),
      'meta.createdAt': Date.now(), // DateUtil(),
    });

    return Utility.buildResponse({ data: serviceSwitch, message: 'Successful' });
  },

  /**
  * Get switch services
  * @public
  */
  async getAllServices(query?: { platform?: string, serviceType?: string, skip?: number, limit?: number }) {
    const services = await ServiceSwitchRepository.findByServiceTypeOrPlatform(query);
    if (!services.data) { throw new NotFoundError('Service not found'); }

    return Utility.buildResponse({ ...services });
  },
  
  /**
  * Create New Switch Services
  * @public
  */
  async createSwitchServices(params: { serviceType: string }) {
    const switchService = await ServiceSwitchRepository.findByServiceType(params.serviceType);
    if (switchService) { throw new ForbiddenError('Switch service already exist, dont break things') };
    const newSwitchService = await ServiceSwitchRepository.createSwitchService({ serviceType: params.serviceType });
    return Utility.buildResponse({ data: newSwitchService });
  },
  
  /**
   * Get switch service Logs
   * @public
   */
  async getSwitchServiceLogs(request) {
    const logs = await ServiceSwitchRepository.getSwitchServiceLogs(request.query);
    if (!logs.data) { throw new NotFoundError('Switch logs not found'); }
    return Utility.buildResponse({ ...logs })
  },


  /**
   * Update Service Charge
   * @param {} params 
   */
  // async updateServiceCharge(request: any) {
  //   const { user, body } = request;
  //   const { serviceType, charge } = body;
  //   const serviceSwitch = await ServiceSwitchRepository.insertService({serviceType: serviceType}, {
  //     charges: charge,
  //     'meta.updatedAt': Date.now(), // DateUtil(),
  //   }, { new: true, upsert: false });

  //   if (!serviceSwitch) { throw new NotFoundError('Service not found') };
    
  //   await ServiceSwitchRepository.createSwitchLog({
  //     serviceType: serviceType,
  //     logMessage: `Changed ${serviceType} service charge to ${charge}`,
  //     user: user.id,
  //     switchService: serviceSwitch._id,
  //     'meta.updatedAt': Date.now(), // DateUtil(),
  //     'meta.createdAt': Date.now(), // DateUtil(),
  //   });

  //   return Utility.buildResponse({ data: serviceSwitch, message: 'Successful' });
  // }
  
}
