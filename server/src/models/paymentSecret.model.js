import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Payment Secret Model
 */

const paymentSecretSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: { type: String },
    phone: { type: String },
    secretHash: { type: String },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

paymentSecretSchema.virtual('secretPin').set(function(val) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(val, salt);
  this.secretHash = hash;
});

paymentSecretSchema.methods.comparePaymentSecret = function(candidatePaymentSecret) {
  return bcrypt.compareSync(candidatePaymentSecret, this.secretHash);
};

export default mongoose.model('PaymentSecret', paymentSecretSchema);
