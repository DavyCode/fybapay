import mongoose from 'mongoose';

/**
 * CommissionHistory Model
 */

const commissionHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: { type: String },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    commissionWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionWallet',
    },
    commission: { type: Number, default: 0 },
    preCommissionBalance: { type: Number },
    postCommissionBalance: { type: Number },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    // todo - add service type
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

commissionHistorySchema.index(
  { '$**': 'text' },
);

export default mongoose.model('CommissionHistory', commissionHistorySchema);
