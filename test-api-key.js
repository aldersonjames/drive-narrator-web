// Test script to verify OpenAI API key works
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Load environment variables manually
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('Loaded .env file from:', envPath);
} else {
  console.log('No .env file found at:', envPath);
}

console.log('Testing OpenAI API key...');
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
console.log('API Key preview:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');

if (!process.env.OPENAI_API_KEY) {
  console.error('No API key found!');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testAPIKey() {
  try {
    console.log('Testing API key with models endpoint...');
    const models = await openai.models.list();
    console.log('✅ API key works! Found', models.data.length, 'models');
    
    console.log('Testing TTS endpoint...');
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: 'Hello, this is a test of the OpenAI TTS API.',
      speed: 1.0,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log('✅ TTS API works! Generated', buffer.length, 'bytes of audio');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
  }
}

testAPIKey();
