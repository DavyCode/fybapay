import { AGENT_COUNTER } from '../config/env';
import { AgentCounter } from '../models';

/**
 * This module is used to keep track of the
 * current agent number count
 */
export const agentCounterInitiator = (AgentCounter) => {
  AgentCounter.findOne({ counter: AGENT_COUNTER }, (err, agentCounter) => {
    if (err) { throw new Error('Failed to initialize agent tracker counter', err); }
    if (agentCounter) {
      console.log('AgentCounter Already Exist');
    } else {
      const newCount = new AgentCounter({ count: 0, counter: AGENT_COUNTER });
      newCount.save((err, saved) => {
        console.log({
          saved: saved
            ? 'True: agentCounter Created'
            : 'False:  agentCounter Creation Failed ',
        });
      });
    }
  });
};

/**
 * Generate agent unique id
 * @param {string} phone
 */
export const generateAgentId = async (phone) => {
  const agentcounter = await AgentCounter.findOne({ counter: AGENT_COUNTER });

  if (!agentcounter) {
    return false;
  }

  const mobile = phone.substring(1, 14);
  const count = agentcounter.count + 1;
  const agentId = `FB${count}${mobile}`; // RQ|156|7053943772

  agentcounter.count += 1;
  agentcounter.updatedAt = Date.now();
  await agentcounter.save();

  return agentId;
};
