import mongoose from 'mongoose';
import { getObjectValues } from '../utils';
import { platform } from '../enumType';
/**
 * Platform Model
 */

const platformSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: [...getObjectValues(platform)],
    },
    platformToken: { type: String, default: '' },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

platformSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('Platform', platformSchema);
