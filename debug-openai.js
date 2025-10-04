// Debug script to test OpenAI with exact same setup as backend
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Load environment variables exactly like the backend does
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

console.log('=== Environment Debug ===');
console.log('Working directory:', process.cwd());
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('API Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) : 'NOT FOUND');
console.log('API Key ends with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(-10) : 'NOT FOUND');

// Create OpenAI instance exactly like backend
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('\n=== Testing TTS with exact backend parameters ===');
async function testTTS() {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: 'Hello test',
      speed: 1.0,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log('✅ TTS works! Generated', buffer.length, 'bytes');
    
  } catch (error) {
    console.error('❌ TTS failed:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Full error:', error);
  }
}

testTTS();

