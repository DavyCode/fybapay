import { AGGREGATOR_COUNTER } from '../config/env';
import { AggregatorCounter } from '../models';

/**
 * This module is used to keep track of the
 * current aggregator number count
 */
export const aggregatorCounterInitiator = (AggregatorCounter) => {
  AggregatorCounter.findOne({ counter: AGGREGATOR_COUNTER }, (err, aggregatorCounter) => {
    if (err) { throw new Error('Failed to initialize aggregator tracker counter', err); }
    if (aggregatorCounter) {
      console.log('AggregatorCounter Already Exist');
    } else {
      const newCount = new AggregatorCounter({ count: 0, counter: AGGREGATOR_COUNTER });
      newCount.save((err, saved) => {
        console.log({
          saved: saved
            ? 'True: AGGREGATOR_COUNTER Created'
            : 'False:  AGGREGATOR_COUNTER Creation Failed ',
        });
      });
    }
  });
};

/**
 * Generate aggregator unique id
 * @param {string} phone
 */
export const generateAggregatorId = async (phone) => {
  const aggregatorCounter = await AggregatorCounter.findOne({ counter: AGGREGATOR_COUNTER });

  if (!aggregatorCounter) {
    return false;
  }

  const mobile = phone.substring(1, 14);
  const count = aggregatorCounter.count + 1;
  const aggregatorId = `FB-AGG${count}${mobile}`; // FB|156|7053943772

  aggregatorCounter.count += 1;
  aggregatorCounter.updatedAt = Date.now();
  await aggregatorCounter.save();

  return aggregatorId;
};
