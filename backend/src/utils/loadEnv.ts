import fs from 'node:fs';
import path from 'node:path';

const parseLine = (line: string): [string, string] | null => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex === -1) {
    return null;
  }
  const key = trimmed.slice(0, equalsIndex).trim();
  const value = trimmed.slice(equalsIndex + 1).trim();
  if (!key) {
    return null;
  }
  const cleaned = value.replace(/^['"]|['"]$/g, '');
  return [key, cleaned];
};

export const loadEnv = (filename = '.env'): void => {
  const envPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const entry = parseLine(line);
    if (!entry) continue;
    const [key, value] = entry;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

export default loadEnv;
