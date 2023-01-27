import mongoose from 'mongoose';


const AuthOtpVerifySchema = new mongoose.Schema(
  {
    phone: { type: String },
    verified: { type: Boolean, default: false }, // verified user
    verifyPhoneOtp: { type: String },
    verifyPhoneOtpTimer: { type: Date }, // timer for phone verification
    otpRequestCount: { type: Number, default: 1 },
    termii_otp_pin_id: { type: String }, // todo --
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('AuthOtpVerify', AuthOtpVerifySchema);
