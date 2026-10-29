export function assertIsolatedTarget(
  databaseUrl: string,
  options: { nodeEnv?: string; operationalUrl?: string } = {
    nodeEnv: process.env.NODE_ENV,
    operationalUrl: process.env.DATABASE_URL,
  },
): string {
  const refuse = () => {
    throw new Error('An explicit isolated test database target is required.');
  };
  let target: URL;
  try {
    target = new URL(databaseUrl);
  } catch {
    return refuse();
  }
  if (
    options.nodeEnv !== 'test' ||
    !['postgres:', 'postgresql:'].includes(target.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) ||
    !/^\/whistle_test_[a-z0-9_]+$/.test(target.pathname) ||
    target.search ||
    target.hash
  )
    return refuse();
  if (options.operationalUrl) {
    let operational: URL;
    try {
      operational = new URL(options.operationalUrl);
    } catch {
      return refuse();
    }
    const local = (host: string) =>
      ['127.0.0.1', 'localhost', '[::1]'].includes(host) ? 'loopback' : host;
    if (
      local(operational.hostname) === local(target.hostname) &&
      (operational.port || '5432') === (target.port || '5432') &&
      operational.pathname === target.pathname
    )
      return refuse();
  }
  return databaseUrl;
}
