// @flow

import { Enquiry } from '../models';

export default {

  /**
   * getEnquiryById
   * @param {string} id 
   */
  async getEnquiryById(id: string) {
    return await Enquiry.findById(id);
  },

  /**
   * enquirySave
   */
  async enquirySave() {
    return await Enquiry.save();
  },

  /**
   * enquiryCreate
   * @param {*} params 
   */
  async enquiryCreate(params: Enquiry) {
    return await Enquiry.create(params);
  }
};