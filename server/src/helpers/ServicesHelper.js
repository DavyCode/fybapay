// @flow

import enumType from '../enumType'
import resources from '../utils/resources';

export default {
  /**
   * Get Available Service Resource
   * @param {string} serviceName
   * @param {string} serviceType
   * @private
   * @description - merges all services resource from diff vendors and combine them to issue services we offer
   */
  getAvailableServiceResource() {
    const filteredResource = [];

    const filterResource = (serviceName) => {
      let result = false;
    
      if (filteredResource.length < 1) {
        return false
      }
    
      filteredResource.filter((item) => {
        if (item.serviceName === serviceName) {
          result = true;
        }
      })
      return result
    };

    for (const service in resources) {

      for (const key in resources[service]) {

        for (const serv in resources[service][key]) {
          
          let ans = filterResource(resources[service][key][serv].Service);
    
          if (!ans) {
            let x = {
              serviceType: key,
              serviceName: resources[service][key][serv].Service,
              serviceID: resources[service][key][serv].serviceID,
              variation: resources[service][key][serv].Product,
              verify: resources[service][key][serv].verify,
              percentageCommission: resources[service][key][serv].percentageCommission,
            }
      
            filteredResource.push(x)
          }
        }
        
      }
    }

    return filteredResource;
  },
  
  /**
   * Get Approved Payment Methods
   * @private
   */
  async getApprovedPaymentMethods() {
    const methods : Array = Object.keys(enumType.paymentMethod);
    return methods;
  },

  /**
   * @public
   */
  async getAvailableServicePlatforms() {
    const platforms: Array = Object.keys(enumType.platform);
    return platforms;
  },

  /**
   * getAvailableServiceTypes
   * @public
   */
  async getAvailableServiceTypes() {
    const serviceTypes: Array = Object.keys(enumType.serviceType);
    return serviceTypes;
  }
};