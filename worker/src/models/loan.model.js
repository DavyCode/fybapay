import mongoose from 'mongoose';


const loanSchema = new mongoose.Schema(
  {
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('Loan', loanSchema);
