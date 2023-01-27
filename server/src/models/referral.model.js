import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referral_code: {
      type: String,
      trim: true,
      lowercase: true,
    },
    referred_by: {
      ref: 'User',
      type: mongoose.Schema.Types.ObjectId,
    },
    referral_balance: { type: Number, default: 0 },
    total_referral_earning: { type: Number, default: 0 },
    user: {
      ref: 'User',
      type: mongoose.Schema.Types.ObjectId,
    },
    phone: { type: String },
    userId: { type: String },
    // wallet: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Wallet',
    // },
    // commissionWallet: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'CommissionWallet',
    // },
    referral_transactions: [ // todo - note: referral earned is a transaction
      {
        ref: 'Transaction',
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    referred_users: [
      {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('Referral', referralSchema);
