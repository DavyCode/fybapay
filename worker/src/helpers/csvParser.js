// @flow

import { Parser } from 'json2csv';
import csvtojsonV2 from 'csvtojson'
import _ from 'lodash';


const bulkWalletToWalletTemplate = [
  'Account_Number',
  'Account_Name',
  'Amount',
  'Narration',
];

const bulkWalletToWallet = [
  {
    "Account_Number": "0214614720",
    "Account_Name": "John Snow",
    "Amount": 40000,
    "Narration": "Balling Cash"
  },
];

const bulkWalletTransferTemplate = [
  'Account_Number',
  'Account_Name',
  'Amount',
  'Narration',
  'Bank_Name',
  'Bank_Code',
];

const bulkTransfer = [
  {
    "Account_Number": "0214614720",
    "Account_Name": "John Snow",
    "Amount": 40000,
    "Narration": "Balling Cash",
    "Bank_Name": "GTB",
    "Bank_Code": "058"
  },
];

export default {
  /**
   * getBulkWalletToWalletTemplate
   */
  async getBulkWalletToWalletTemplate() {
    const json2csvParser = new Parser({ fields: bulkWalletToWalletTemplate });
    const file = json2csvParser.parse(bulkWalletToWallet);
    return file;
  },

  /**
   * getBulkWalletTransferTemplate
   * @private
   */
  async getBulkWalletTransferTemplate() {
    const json2csvParser = new Parser({ fields: bulkWalletTransferTemplate });
    const file = json2csvParser.parse(bulkTransfer);
    return file;
  },

  /**
   * Parse Bulk Wallet To Wallet Csv
   * @param {*} file
   */
  async parseBulkFundTransferCsv(file: { tempFilePath: string }) {
    const jsonList = await csvtojsonV2().fromFile(file.tempFilePath);
    return jsonList;
  },

  /**
   * Validate Csv Input
   * @param {array} transferList 
   * @todo 
   */
  async validateW2WCsvInputs(transferList) {
    let validCsv = {
      isValid: true,
      error: '',
      payload: [],
    }  

    if (!_.isEqual(Object.keys(bulkWalletToWallet[0]), Object.keys(transferList[0]))) {
      validCsv.isValid = false
      validCsv.error = 'Wrong CSV headers'
      validCsv.payload.push(...Object.keys(transferList[0])) 
      return validCsv
    };
    
    for (let i = 0; i < transferList.length; i++) {
      let values =  Object.values(transferList[i]);
      
      if (values && values.length > 0 && values.length === 4) { 
        let isEmpty = isEmptyStringArray(values)
        
        if (isEmpty) {
          validCsv.isValid = false
          validCsv.error = 'Problem with record(s)';
          validCsv.payload.push({
            error: 'Problem with record(s), record cannot be null or empty please check it',
            record: transferList[i],
            itemRowPosition: i + 1
          });
        }
      }
      else {
        validCsv.isValid = false
        validCsv.error = 'Problem with record(s)';
        validCsv.payload.push({
          error: 'Problem with record(s), record cannot be null or empty please check it',
          record: transferList[i],
          itemRowPosition: i + 1
        });
      }

    }
    return validCsv
  },

  /**
   * Validate fund transfer Csv input
   * @param {array} transferList 
   * @todo
   */
  async validateFundTransferCsvInputs(transferList) {
    let validCsv = {
      isValid: true,
      error: '',
      payload: [],
    }  

    if (!_.isEqual(Object.keys(bulkTransfer[0]), Object.keys(transferList[0]))) {
      validCsv.isValid = false
      validCsv.error = 'Wrong CSV headers'
      validCsv.payload.push(...Object.keys(transferList[0])) 
      return validCsv
    };
    
    for (let i = 0; i < transferList.length; i++) {
      let values =  Object.values(transferList[i]);
      
      if (values && values.length > 0 && values.length === 6) { 
        let isEmpty = isEmptyStringArray(values)
        
        if (isEmpty) {
          validCsv.isValid = false
          validCsv.error = 'Problem with record(s)';
          validCsv.payload.push({
            error: 'Problem with record(s), record cannot be null or empty please check it',
            record: transferList[i],
            itemRowPosition: i + 1
          });
        }
      }
      else {
        validCsv.isValid = false
        validCsv.error = 'Problem with record(s)';
        validCsv.payload.push({
          error: 'Problem with record(s), record cannot be null or empty please check it',
          record: transferList[i],
          itemRowPosition: i + 1
        });
      }

    }
    return validCsv
  }
};

function isEmptyStringArray(arrayItem) {
  let nullValue = []
  arrayItem.filter(item => {
    if (item == null) {
      nullValue.push(item)
    }
    if (item == 'null') {
      nullValue.push(item)
    }
    if (item == undefined) {
      nullValue.push(item)
    }
    if (item == 'undefined') {
      nullValue.push(item)
    }
    if (item === '') {
      nullValue.push(item)
    }
    if (item.trim().length <= 0) {
      nullValue.push(item)
    }
  })
  if (nullValue.length > 0) {
    return true
  }

  // let emptyStrings = arrayItem.filter(str => str.trim().length <= 0);
  // if (emptyStrings.length > 0) {
  //   return true
  // }

  return false
}