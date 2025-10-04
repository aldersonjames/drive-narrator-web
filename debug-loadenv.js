// Debug the loadEnv function
const fs = require('fs');
const path = require('path');

// Copy the loadEnv function from the backend
const parseLine = (line) => {
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

const loadEnv = (filename = '.env') => {
  const envPath = path.resolve(process.cwd(), filename);
  console.log('Loading .env from:', envPath);
  if (!fs.existsSync(envPath)) {
    console.log('File does not exist');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  console.log('File content length:', content.length);
  console.log('File content preview:', content.substring(0, 100) + '...');
  
  for (const line of content.split(/\r?\n/)) {
    console.log('Processing line:', JSON.stringify(line));
    const entry = parseLine(line);
    if (!entry) {
      console.log('  -> Skipped');
      continue;
    }
    const [key, value] = entry;
    console.log('  -> Key:', key, 'Value length:', value.length);
    console.log('  -> Value preview:', value.substring(0, 20) + '...');
    if (process.env[key] === undefined) {
      process.env[key] = value;
      console.log('  -> Set in process.env');
    } else {
      console.log('  -> Already exists, skipping');
    }
  }
};

// Test loading the .env file
console.log('=== Testing loadEnv function ===');
loadEnv('backend/.env');

console.log('\n=== Final result ===');
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_API_KEY preview:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');

