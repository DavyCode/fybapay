// @flow

import banks from '../utils/banks'

export default {
  /**
   * getBankName
   * @param {*} bankCode
   * @public
   */
  async getBankName(bankCode: string) {
    const bank_array = await banks.filter((bank, i) => bank.hasOwnProperty(bankCode));
  
    if (!bank_array || bank_array.length < 1) { return false }
  
    const requested_bank = Object.values(bank_array[0]);
    return requested_bank[0];
  },
};

// export const saveUserCard = async (transaction) => {
//   // check if authorization and card is reusable
//   // get the owner of transaction
//   // update their cards list if card doesnt curently exist
//   //OR
//   // just collect user card details and save directly and ask for pin to authorize any trx
// };
