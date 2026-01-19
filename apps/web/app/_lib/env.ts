import "server-only";

const MISSING_ENV_PREFIX = "Environment variable ";
const MISSING_ENV_SUFFIX = " is not set";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${MISSING_ENV_PREFIX}${name}${MISSING_ENV_SUFFIX}`);
  }
  return value;
}

export function isMissingEnvError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.startsWith(MISSING_ENV_PREFIX) &&
    error.message.endsWith(MISSING_ENV_SUFFIX)
  );
}
