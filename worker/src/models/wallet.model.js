import mongoose from 'mongoose';

/**
 * Wallet Model
 */

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: { type: String },
    accountNumber: { type: String },
    accountName: { type: String },
    monifyAccountReference: { type: String },
    monifyReservetionReference: { type: String },
    bankName: { type: String },
    bankCode: { type: String },
    balance: { type: Number, default: 0 },
    limit: { type: Number },
    // commissionBalance: { type: Number, default: 0 },
    commissionWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionWallet',
    },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

walletSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.monifyAccountReference;
  delete obj.monifyReservetionReference;
  delete obj.__v;
  return obj;
};

walletSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('Wallet', walletSchema);
