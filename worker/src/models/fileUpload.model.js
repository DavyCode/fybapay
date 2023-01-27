import mongoose from 'mongoose';

/**
 * Wallet Model
 */

const fileUploadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: { type: String },
    fullPicture: { type: String },
    idCard: { type: String },
    utilityBill: { type: String },
    profileImage: { type: String, default: 'https://via.placeholder.com/150' },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('FileUpload', fileUploadSchema);
