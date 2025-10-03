#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ports = [41234, 5173, 4173];

const killOnPosix = async (port) => {
  let stdout = '';
  try {
    ({ stdout } = await exec('lsof', ['-ti', `tcp:${port}`], { timeout: 4000 }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('lsof command not found; unable to stop servers automatically.');
      throw error;
    }

    stdout = error.stdout ?? '';

    if (!stdout) {
      console.log(`No process information for port ${port}`);
      return;
    }
  }

  const pids = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!pids.length) {
    console.log(`No process running on port ${port}`);
    return;
  }

  for (const pid of pids) {
    const numericPid = Number.parseInt(pid, 10);
    if (Number.isNaN(numericPid)) continue;

    try {
      process.kill(numericPid, 'SIGKILL');
      console.log(`Stopped PID ${numericPid} on port ${port}`);
    } catch (error) {
      if (error.code === 'ESRCH') {
        console.log(`PID ${numericPid} already stopped`);
      } else {
        console.error(`Failed to stop PID ${numericPid} on port ${port}: ${error.message}`);
      }
    }
  }
};

const killOnWindows = async (port) => {
  const { default: killPort } = await import('kill-port');
  try {
    await killPort(port);
    console.log(`Stopped process on port ${port}`);
  } catch (error) {
    const message = error?.message ?? '';
    if (/No process running/i.test(message)) {
      console.log(`No process running on port ${port}`);
      return;
    }
    console.error(`Failed to stop port ${port}: ${message}`);
  }
};

const stopPort = async (port) => {
  if (process.platform === 'win32') {
    await killOnWindows(port);
    return;
  }

  await killOnPosix(port);
};

const run = async () => {
  for (const port of ports) {
    // sequential execution keeps output deterministic
    // eslint-disable-next-line no-await-in-loop
    await stopPort(port);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
