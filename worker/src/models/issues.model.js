import mongoose from 'mongoose';
import { issueCategory, issueStatus } from '../enumType';
import { getObjectValues } from '../utils'


const issuesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    receipt: { type: String, trim: true, default: 'https://res.cloudinary.com/davycode/image/upload/v1590239023/avatar.png' },
    message: { type: String, trim: true },
    issueCategory: { type: String, enum: [...getObjectValues(issueCategory)] },
    status: { type: String, default: 'OPEN', enum: [...getObjectValues(issueStatus)] },
    attendendToBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    issueReferenceId: { type: String, trim: true },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('Issues', issuesSchema);
