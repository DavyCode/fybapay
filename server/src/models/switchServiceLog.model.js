import mongoose from 'mongoose';
import { getObjectValues, getObjectKeys } from '../utils';
import { serviceType, platform, service } from '../enumType';

/**
 * ServiceSwitch Model
 */

const serviceSwitchLogSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: [...getObjectValues(platform)],
    },
    serviceType: {
      type: String,
      enum: [...getObjectValues(serviceType)],
    },
    switchService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceSwitch',
    },
    layerTwoSwitch: { // todo: Layer 2 switch impl
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LayerTwoSwitch',
    },
    serviceName: { // todo: Layer 2 switch impl
      type: String,
      enum: [...getObjectKeys(service)],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    charges: {
      type: Number,
      default: 0,
    },
    logMessage: { type: String, default: 'Switch service platform' },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

serviceSwitchLogSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('ServiceSwitchLog', serviceSwitchLogSchema);
