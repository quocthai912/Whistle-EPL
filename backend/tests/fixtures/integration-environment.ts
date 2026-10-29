import { assertIsolatedTarget } from './isolated-target.guard';

// Refuse before any test creates a connection or mutates a schema.
assertIsolatedTarget(process.env.TEST_DATABASE_URL ?? '');
