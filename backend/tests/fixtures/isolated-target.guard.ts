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
    !target.port ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) ||
    !/^\/whistle_test_[a-z0-9_]+$/.test(target.pathname) ||
    target.search ||
    target.hash
  )
    return refuse();
  if (options.operationalUrl) {
    let operational: URL;
    let operationalDatabase: string;
    try {
      operational = new URL(options.operationalUrl);
      if (
        !['postgres:', 'postgresql:'].includes(operational.protocol) ||
        !operational.port ||
        operational.search ||
        operational.hash
      )
        return refuse();
      operationalDatabase = decodeURIComponent(operational.pathname);
    } catch {
      return refuse();
    }
    const local = (host: string) => {
      const normalized = host.toLowerCase();
      return ['127.0.0.1', 'localhost', '[::1]'].includes(normalized) ? 'loopback' : normalized;
    };
    if (
      local(operational.hostname) === local(target.hostname) &&
      operational.port === target.port &&
      operationalDatabase === decodeURIComponent(target.pathname)
    )
      return refuse();
  }
  return databaseUrl;
}
