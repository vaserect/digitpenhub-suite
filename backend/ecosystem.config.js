module.exports = {
  apps: [
    {
      name: 'digitpenhub-suite-api',
      script: './src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
    },
  ],
};
