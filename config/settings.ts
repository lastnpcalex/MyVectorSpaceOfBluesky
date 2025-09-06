export const CONFIG = {
  // Central account for analysis
  CENTRAL_ACCOUNT: {
    handle: 'lastnpcalex.agency',
    did: 'did:plc:ccxl3ictrlvtrrgh5swvvg47',
  },

  // List configuration
  LIST_NAME: 'Our Vectorspace of Bluesky',
  LIST_DESCRIPTION: 'Users in my interaction network',

  // Feed configurations
  FEED_NAME: 'My Vectorspace Feed',
  FEED_DESCRIPTION: 'Content from my interaction network',

  // Analysis parameters
  ANALYSIS_PERIOD_DAYS: 30,
  TOP_USERS_COUNT: 50,

  // GitHub Actions schedule (cron syntax)
  UPDATE_SCHEDULE: '0 0 * * *', // Daily at midnight
} as const;

export default CONFIG;
