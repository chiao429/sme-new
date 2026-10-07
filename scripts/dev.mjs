import { spawn } from 'node:child_process';

const processes = [
  spawn(process.execPath, ['--watch', 'backend/server.mjs'], { stdio: 'inherit' }),
  spawn('npx', ['vite', '--config', 'frontend/vite.config.js'], { stdio: 'inherit' }),
];

const stop = () => {
  for (const child of processes) child.kill('SIGINT');
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

for (const child of processes) {
  child.on('exit', (code) => {
    if (code && code !== 130) process.exitCode = code;
  });
}
