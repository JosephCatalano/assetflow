import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

let environmentLoaded = false;

const ENV_PATH_CANDIDATES = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'packages', 'db', '.env'),
  resolve(process.cwd(), '..', '..', 'packages', 'db', '.env'),
  resolve(__dirname, '../../../../packages/db/.env'),
];

export function loadEnvironment(): void {
  if (environmentLoaded) {
    return;
  }

  environmentLoaded = true;

  for (const envPath of new Set(ENV_PATH_CANDIDATES)) {
    if (!existsSync(envPath)) {
      continue;
    }

    const result = loadDotenv({
      path: envPath,
      override: false,
    });

    if (result.error) {
      throw result.error;
    }

    break;
  }
}
