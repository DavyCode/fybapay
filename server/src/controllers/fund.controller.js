// @flow

import { Request, Response, NextFunction } from 'express';
import FundServices from '../services/FundServices'

export default {
  
  /**
   * Fund Transfer
   * @public
   */
  async fundTransfer(request: Request, response: Response, next: NextFunction) {
    const result = await FundServices.fundTransfer(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get Transfer Charges
   * @public
   */
  async getTransferCharges(request: Request, response: Response, next: NextFunction) {
    const result = await FundServices.getTransferCharges(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get Bulk Fund Transfer Template
   * @public
   */
  async getBulkFundTransferTemplate(request: Request, response: Response, next: NextFunction) {
    const result = await FundServices.getBulkFundTransferTemplate(request);
    
    response.set("Content-Disposition", "attachment;filename=template.csv");
    response.set("Content-Type", "application/octet-stream");
    
    return response.status(result.statusCode).send(result);
  },

  /**
   * Bulk transfer wallet to wallet
   * @public
   */
  async bulkTransferWalletToWallet (request: Request, response: Response, next: NextFunction) {
    const result = await FundServices.bulkTransferWalletToWallet(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Bulk fund transfer
   * @public
   */
  async bulkFundTransfer (request: Request, response: Response, next: NextFunction) {
    const result = await FundServices.bulkFundTransfer(request);
    return response.status(result.statusCode).send(result);
  },

   /**
   * Get bulk transfer charges
   * @public
   */
  async bulkTransferCharges(request: Request, response: Response, next: NextFunction) {
    const result = await FundServices.bulkTransferCharges(request);
    return response.status(result.statusCode).send(result);
  },
}