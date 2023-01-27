/**
 * Process executed on server startup
 */

import { AgentCounter, AggregatorCounter, ServiceSwitch, Platform, AppUpdate } from '../models';
import { agentCounterInitiator } from '../utils/agentCounter';
import { aggregatorCounterInitiator } from '../utils/aggregatorCounter';
import serviceSwitchSeeder from '../utils/serviceSwitchSeeder';
import platformSeeder from '../utils/platformSeeder';
import appUpdateSeeder from '../utils/appUpdateSeeder';

export default () => {
  agentCounterInitiator(AgentCounter);
  aggregatorCounterInitiator(AggregatorCounter);
  serviceSwitchSeeder(ServiceSwitch);
  platformSeeder(Platform);
  appUpdateSeeder(AppUpdate);
};
