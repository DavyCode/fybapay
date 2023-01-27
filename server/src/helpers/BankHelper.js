// @flow

import banks from '../utils/banks';
import primeBanks from '../utils/primeBanks';
import rubiesBankList from '../utils/rubiesBankList';

export default {
  /**
   * getBankName
   * @param {string} bankCode
   * @private
   */
  async getBankName(bankCode: string) {
    const bank_array = await banks.filter((bank, i) => bank.hasOwnProperty(bankCode));
  
    if (bank_array.length < 1) { return false }
  
    const requested_bank = Object.values(bank_array[0]);
    return requested_bank[0];
  },

  /**
   * Get Bank By BankCode
   * @param {string} bankCode
   * @private
   */
  async getBankByBankCode(bankCode: string) {
    const bank = await banks.filter((bank, i) => bank.hasOwnProperty(bankCode));
    
    if (bank.length < 1) { return false }

    return bank[0];
  },

  /**
   * getprimeAirtimeBankByBankCode
   * @param {String} bankCode 
   */
  async getprimeAirtimeBankByBankCode(bankCode: string) {
    const bank = await primeBanks.filter((bankItem, i) => Object.values(bankItem).includes(bankCode));
    
    if (bank.length < 1) { return false }

    return bank[0];
  },

  /**
   * getRubiesBankByBankCode
   * @param {String} bankCode 
   */
  async getRubiesBankByBankCode(bankCode: string) {
    const bank = await rubiesBankList.filter((bankItem, i) => Object.values(bankItem).includes(bankCode));
    
    if (bank.length < 1) { return false }

    return bank[0];
  },
};

// export const saveUserCard = async (transaction) => {
//   // check if authorization and card is reusable
//   // get the owner of transaction
//   // update their cards list if card doesnt curently exist
//   //OR
//   // just collect user card details and save directly and ask for pin to authorize any trx
// };
