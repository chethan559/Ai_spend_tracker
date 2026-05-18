/**
 * Runs before every test file (via setupFilesAfterEnv in jest.config.js).
 * Refuses to proceed if we're not pointed at a safe test database.
 *
 * How it works:
 *   .env.test must contain TEST_SAFE=true
 *   jest.config.js loads .env.test before any test module is imported
 *   If TEST_SAFE is missing the guard throws, stopping all tests before
 *   any deleteMany() calls can reach a real database.
 */
const dbUrl = process.env.DATABASE_URL ?? '(not set)';
const masked = dbUrl.length > 40 ? dbUrl.slice(0, 40) + '…' : dbUrl;

if (process.env.TEST_SAFE !== 'true') {
  throw new Error(
    '\n' +
    '╔══════════════════════════════════════════════════════════╗\n' +
    '║  SAFETY ABORT — tests refused to run                    ║\n' +
    '╠══════════════════════════════════════════════════════════╣\n' +
    '║  TEST_SAFE=true was not found in the environment.        ║\n' +
    '║                                                          ║\n' +
    '║  Tests call deleteMany() on every table. Running them   ║\n' +
    '║  against the production database will wipe all data.    ║\n' +
    '║                                                          ║\n' +
    '║  Fix: make sure backend/.env.test exists and contains:  ║\n' +
    '║    TEST_SAFE=true                                        ║\n' +
    '║    DATABASE_URL=<your dedicated test database URL>       ║\n' +
    '╚══════════════════════════════════════════════════════════╝\n' +
    `  Current DATABASE_URL: ${masked}\n`,
  );
}
