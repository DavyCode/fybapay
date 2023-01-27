// @flow

import Pubsub from '../events'
// import { sendSms } from '../utils/Sms';

/**
 * admin_assigned_new_aggregator
 */
Pubsub.on('admin_assigned_new_aggregator', async (message) => {
  /**
   * @todo - MAIL ADMIN
   * mail user
   */
  try {
    
  } catch (error) {
    console.log(error.message)
  }
});

/**
 * aggregator_assign_terminal_to_agent
 */
Pubsub.on('aggregator_assign_terminal_to_agent', async ({ terminal, agent, aggregator }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {
    
  } catch (error) {
    console.log(error.message)
  }
});

/**
 * aggregator_removed_terminal_from_agent
 */
Pubsub.on('aggregator_removed_terminal_from_agent', async ({ terminal, agent, aggregator }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {
  } catch (error) {
    console.log(error.message);
  }
});

/**
 * aggregator_block_pos
 */
Pubsub.on('aggregator_block_pos', async ({ terminal, agent, aggregator }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {
  } catch (error) {
    console.log(error.message);
  }
});

Pubsub.on('aggregator_unblock_pos', async ({ terminal, agent, aggregator }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {
  } catch (error) {
    console.log(error.message);
  }
});

export default Pubsub;
