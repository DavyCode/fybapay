import mongoose from 'mongoose';

/**
 * Agent Request Model
 */

const agentRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    agentApproved: { type: Boolean, default: false },
    agentOnboardingDate: { type: Date },
    agentId: { type: String }, // 'RQ1567053943772', // todo - display on app
    businessName: { type: String, trim: true },
    businessState: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    businessLga: { type: String, trim: true },
    businessCity: { type: String, trim: true },
    idCard: {
      type: String,
      trim: true,
      // default: 'https://res.cloudinary.com/davycode/image/upload/v1590239023/avatar.png' 
    },
    prevRole: { type: String },
    agentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

agentRequestSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.__v;
  return obj;
};


agentRequestSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('AgentRequest', agentRequestSchema);
