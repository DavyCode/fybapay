// @flow

import enumType from '../enumType'
import { BadRequestError } from '../utils/errors'
import { airvendResource, primeAirtimeServices, vtpassServices } from '../utils/resources';

export default {
  /**
   * Format service variation
   */
  async formatVariation(platformVariation: array, platform: string, serviceType: string, serviceName?: string) {
        
    if (platform === enumType.platform.VTPASS) {
      // if (serviceType === enumType.serviceType.DATA) {
      //   return formatVtpassData(platformVariation);
      // }

      // if (serviceType === enumType.serviceType.CABLETV) {
      //   return formatVtpassMultichoice(platformVariation);
      // }

      return formatVtpassMultichoice(platformVariation);;
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
      
      if (serviceType === enumType.serviceType.CABLETV) {
        return formatPrimeAirtimeMultichoice(platformVariation);
      }
      else if (serviceType === enumType.serviceType.DATA) {
        if (serviceName === 'SPECTRANET_PIN' || serviceName === 'SMILE_BUNDLE') {
          return formatPrimeAirtimeMultichoice(platformVariation)
        }
        return formatPrimeAirtimeData(platformVariation);
      }
      else if (serviceType === enumType.serviceType.JAMB || serviceType === enumType.serviceType.WAEC) {
        return formatPrimeAirtimeMultichoice(platformVariation);
      }
      else {
        // todo: add other serviceType if they have variation
        throw new BadRequestError('provide a valid serviceType')
      }
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
      return { error: `Service not available for ${serviceType}` };
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
  resolveVtpassServices(serviceName: string, serviceType: string) {
    // validate that serviceType && has the supplied serviceName
    if (!vtpassServices.hasOwnProperty(serviceType)) {
      return { error: 'Service type not valid'};
    }
  
    if (!vtpassServices[serviceType].hasOwnProperty(serviceName)) {
      return { error: `Service not available for ${serviceType}` };
    }
    return vtpassServices[serviceType][serviceName];
  },

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
      return { error: `Service not available for ${serviceType}` };
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
      variation_amount: Math.floor(Number(Amount)),
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
      name: `₦${Amount? Math.floor(Number(Amount)) : Math.floor(Number(amount))} ${name ? name : ''} `,
      variation_amount: `${Amount? Math.floor(Number(Amount)) : Math.floor(Number(amount))}`,
      variation_code: code ? code : count ? count : '',
      fixedPrice: true
    })
    return formatedVariation;
  }

  for (let i = 0; i < platformVariation.length; i++) {
    const { Amount, amount, code, name } = platformVariation[i];
    let variation = Object.assign({}, {
      name: `₦${Amount? Math.floor(Number(Amount)) : Math.floor(Number(amount))} ${name} `,
      variation_amount: `${Amount? Math.floor(Number(Amount)) : Math.floor(Number(amount))}`,
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
      variation_amount: Math.floor(Number(Amount)),
      variation_code: code? code: count? count: '',
      fixedPrice: true
    })
    formatedVariation.push(variation)
  }
  return formatedVariation;
}

function formatPrimeAirtimeData(platformVariation) {
  let formatedVariation = []
  for (let x = 0; x < platformVariation.length; x++) {    
    const { price, product_id, validity } = platformVariation[x]
    // "name": "₦100 100MB - 1Day",
    let y = product_id.split('-')[3];
    let variation = Object.assign({}, {
      name: `₦${price} ${y} - ${validity}`,
      variation_amount: Math.floor(Number(price)),
      variation_code: product_id,
      fixedPrice: true
    })
    formatedVariation.push(variation)
  }
  return formatedVariation;
}

function formatPrimeAirtimeMultichoice(platformVariation) {
  let formatedVariation = []
  for (let x = 0; x < platformVariation.length; x++) {
    const { name, price, code } = platformVariation[x]
    let variation = Object.assign({}, {
      name: `₦${Math.floor(price)} - ${name}`,
      variation_amount: Math.floor(Number(price)),
      variation_code: code,
      fixedPrice: true
    })
    formatedVariation.push(variation)
  }
  return formatedVariation; 
}

// function formatVtpassData(platformVariation) {
//   console.log({
//     formatVtpassData: platformVariation
//   })
// }

// {
//   variation_code: 'dstv1',
//   name: 'DStv Access N2000',
//   variation_amount: '2000.00',
//   fixedPrice: 'Yes'
// },

function formatVtpassMultichoice(platformVariation) {
  let formatedVariation = []
  for (let x = 0; x < platformVariation.length; x++) {
    const { name, fixedPrice, variation_amount, variation_code } = platformVariation[x]
    let variation = Object.assign({}, {
      // name: `₦${Math.floor(variation_amount)} - ${name}`,
      name,
      variation_amount: Math.floor(Number(variation_amount)),
      variation_code: variation_code,
      fixedPrice: 'Yes' ? true : false,
    })
    formatedVariation.push(variation)
  }
  return formatedVariation;
}