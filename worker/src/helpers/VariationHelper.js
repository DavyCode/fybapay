// @flow

import enumType from '../enumType'
import { BadRequestError } from '../utils/errors'
import { airvendResource, primeAirtimeServices, vtpassServices } from '../utils/resources';

export default {
  /**
   * Format service variation
   */
  async formatVariation(platformVariation, platform: string, serviceType: string) {
        
    if (platform === enumType.platform.VTPASS) {
      return platformVariation
    }
    else if (platform === enumType.platform.AIRVEND) {
      if (serviceType === enumType.serviceType.CABLETV) {
        return formatAirvendCableTv(platformVariation);
      }
      else if (serviceType === enumType.serviceType.DATA) {
        return formatAirvendData(platformVariation);
      }
      else if (serviceType === enumType.serviceType.JAMB || serviceType === enumType.serviceType.WAEC) {
        return formatAirvendOtherService(platformVariation);
      }
      else {
        // todo: add other serviceType if they have variation
        throw new BadRequestError('provide a valid serviceType')
      }
      
    }
    else if (platform === enumType.platform.PRIMEAIRTIME) {
      // handle PRIMEAIRTIME
      return platformVariation
    }
    else {
      throw new BadRequestError('provide a valid serviceType')
    }

  },

  /**
   * Resolve Airvend Services
   * @param {string} serviceName
   * @param {string} serviceType
   * @private
   */
  resolveAirvendServices(serviceName: string, serviceType: string) {
    // validate that serviceType && has the supplied serviceName
    if (!airvendResource.hasOwnProperty(serviceType)) {
      return { error: 'Service type not valid'};
    }
  
    if (!airvendResource[serviceType].hasOwnProperty(serviceName)) {
      return { error: `Service name not valid for ${serviceType}` };
    }
    return airvendResource[serviceType][serviceName];
  },

  /**
   * Resolve VTPASS Services
   * @param {string} serviceName
   * @param {string} serviceType
   * @todo - resolveVtpassServices
   * @private
   */
  resolveVtpassServices() {},

  /**
   * Resolve Primeairtime Services
   * @param {string} serviceName
   * @param {string} serviceType
   * @private
   */
  resolvePrimeairtimeServices(serviceName: string, serviceType: string) {
    // validate that serviceType && has the supplied serviceName
    if (!primeAirtimeServices.hasOwnProperty(serviceType)) {
      return { error: 'Service type not valid'};
    }
  
    if (!primeAirtimeServices[serviceType].hasOwnProperty(serviceName)) {
      return { error: `Service name not valid for ${serviceType}` };
    }
    return primeAirtimeServices[serviceType][serviceName];
  },
};

function formatAirvendCableTv(platformVariation) {
  let formatedVariation = []

  for (let i = 0; i < platformVariation.length; i++) {
    const { Amount, code, name } = platformVariation[i];
    let variation = Object.assign({}, {
      name: `${name} ₦${Amount}`,
      variation_amount: Amount,
      variation_code: code,
      fixedPrice: true
    })
    formatedVariation.push(variation)
  }
  return formatedVariation;
}

function formatAirvendOtherService(platformVariation) {
  let formatedVariation = []
  if (typeof platformVariation === 'object') {
    const { Amount, amount, code, name, count } = platformVariation;
    formatedVariation.push({
      name: `₦${Amount? Amount: amount} ${name? name: ''}`,
      variation_amount: `${Amount? Amount: amount}`,
      variation_code: code? code: count? count: '',
      fixedPrice: true
    })
    return formatedVariation;
  }

  for (let i = 0; i < platformVariation.length; i++) {
    const { Amount, amount, code, name } = platformVariation[i];
    let variation = Object.assign({}, {
      name: `₦${Amount? Amount: amount} ${name} `,
      variation_amount: `${Amount? Amount: amount}`,
      variation_code: code,
      fixedPrice: true
    });
    formatedVariation.push(variation)
  }
  return formatedVariation;
}

function formatAirvendData(platformVariation) {
  let formatedVariation = []

  for (let x = 0; x < platformVariation.length; x++) {    
    const { description, descrition, Validity, count, Amount, code, validity } = platformVariation[x]
    let variation = Object.assign({}, {
      name: `₦${Amount} ${description? description: descrition } - ${validity? validity: Validity? Validity: count}`, // todo: issue with spectranet
      variation_amount: Amount,
      variation_code: code? code: count ? count: '',
      fixedPrice: true
    })
    formatedVariation.push(variation)
  }
  return formatedVariation;
}