// @flow 

export default {
  /**
   * getTotalAmount
   * @param {*} transferList 
   */
  getTotalAmount(transferList: Array) {
    let totalTransferAmount = 0;
    try {
      transferList.forEach(transfer => { totalTransferAmount += parseInt(transfer.Amount, 10) });
    } catch (error) {
      console.log(error)
    }
    return totalTransferAmount;
  } 
}