import mongoose from 'mongoose';
import { getObjectValues, getObjectKeys } from '../utils';
import { serviceType, platform, service } from '../enumType';

/**
 * ServiceSwitch Model
 */
const LayerTwoSwitchSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: [...getObjectValues(platform)],
    },
    serviceType: {
      type: String,
      enum: [...getObjectValues(serviceType)],
    },
    serviceName: {
      type: String,
      enum: [...getObjectKeys(service)],
    },
    platformToken: { type: String, default: '' },
    charges: { type: Number, default: 0 },
    chargesApply: { type: Boolean, default: false },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

LayerTwoSwitchSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('LayerTwoSwitch', LayerTwoSwitchSchema);
