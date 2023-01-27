import mongoose from 'mongoose';
import { transactionType } from '../enumType';
import { getObjectValues } from '../utils';


const Schema = mongoose.Schema;


const BeneficiarySchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: { type: String },
    accountNumber: { type: String },
    accountName: { type: String },
    bankName: { type: String },
    bankCode: { type: String },
    phoneNumber: { type: String },
    transactionType: {
      type: String,
      enum: [...getObjectValues(transactionType)], // type of trx
    },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true })

export default mongoose.model('Beneficiary', BeneficiarySchema);
