import cron from 'node-cron';

import { sendWeeklyDigests } from '../services/alert.service';
import { logger } from '../utils/logger';

export function startWeeklyDigestJob(): void {
  // Runs every Monday at 09:00 server time.
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Weekly digest job started');
    try {
      await sendWeeklyDigests();
      logger.info('Weekly digest job completed');
    } catch (error) {
      logger.error('Weekly digest job failed', error as Error);
    }
  });
}
