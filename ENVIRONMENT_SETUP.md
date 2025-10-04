# Environment Setup Guide

This guide helps you avoid common environment variable issues when setting up AI-powered projects.

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your OpenAI API key:**
   - Get your API key from: https://platform.openai.com/account/api-keys
   - Replace `sk-proj-your-actual-openai-api-key-here` in `.env` with your real key

3. **Verify the setup:**
   ```bash
   npm run dev
   ```
   Look for: `✅ Voice preview enabled with validated API key`

## Common Issues & Solutions

### Issue: "Incorrect API key provided: sk-test-key"

**Cause:** The backend is using a hardcoded test key instead of your real API key.

**Solution:**
1. Check if `.env` file exists: `ls -la .env`
2. Verify your API key is in the file: `grep OPENAI_API_KEY .env`
3. Make sure the key starts with `sk-proj-` or `sk-` and is 50+ characters long
4. Restart the backend server

### Issue: Environment variables not loading

**Cause:** The `.env` file is in the wrong location or has incorrect format.

**Solution:**
1. Ensure `.env` is in the project root directory
2. Check file format (no spaces around `=`):
   ```bash
   OPENAI_API_KEY=sk-proj-your-key-here
   ```
   Not:
   ```bash
   OPENAI_API_KEY = sk-proj-your-key-here
   ```

### Issue: Shell environment variables overriding .env

**Cause:** Environment variables are set in your shell profile (`.zshrc`, `.bashrc`, etc.)

**Solution:**
1. Check for conflicting variables:
   ```bash
   env | grep -E "OPENAI_API_KEY|ELEVENLABS_API_KEY|GITHUB_PAT|GITHUB_USERNAME"
   ```
2. Remove them from shell config files:
   ```bash
   # Edit your shell config
   nano ~/.zshrc
   # Comment out or remove lines like:
   # export OPENAI_API_KEY=...
   ```
3. Restart your terminal or run: `source ~/.zshrc`

## Environment File Locations

The backend looks for `.env` files in this order:
1. `./backend/.env` (when running from backend directory)
2. `./.env` (when running from project root)

## Validation

The `openaiClient.ts` utility automatically validates:
- ✅ API key exists
- ✅ API key format is correct (starts with `sk-`, proper length)
- ✅ API key is not a test/placeholder value
- ✅ OpenAI client can be created successfully

## Security Notes

- Never commit `.env` files to version control
- Use `.env.example` for documentation
- Rotate API keys regularly
- Use different keys for development/production
