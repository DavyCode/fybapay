// @flow

/**
 * Date Utility
 * @description - handles setting date time to user local time
 */
export default () => {
  const rightNow = new Date();

  return rightNow.setMinutes(rightNow.getMinutes() + (1 * 60));
};
