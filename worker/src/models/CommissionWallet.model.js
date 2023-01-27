import mongoose from 'mongoose';

/**
 * Commission Model
 */

const commissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    userId: { type: String, trim: true },
    balance: { type: Number, default: 0 },
    overallEarnings: { type: Number, default: 0 },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

commissionSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('CommissionWallet', commissionSchema);
