import mongoose from 'mongoose';
import { getObjectValues } from '../utils';
import { serviceType, platform } from '../enumType';
import uniqueValidator from 'mongoose-unique-validator';

/**
 * ServiceSwitch Model
 */
const serviceSwitchSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      // unique: true,
      // // index: true,
      trim: true,
      enum: [...getObjectValues(platform)],
    },
    serviceType: {
      type: String,
      // unique: true,
      // index: true,
      trim: true,
      enum: [...getObjectValues(serviceType)],
    },
    platformToken: { type: String, default: '' },
    charges: { type: Number, default: 0 },
    chargesApply: { type: Boolean, default: false },
    shouldUseService: { type: Boolean, default: true },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

serviceSwitchSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

serviceSwitchSchema.index(
  { '$**': 'text' },
);

serviceSwitchSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.platformToken;
  delete obj.__v;
  return obj;
};

export default mongoose.model('ServiceSwitch', serviceSwitchSchema);
