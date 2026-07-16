module.exports = {
  apps: [
    {
      name: 'digitpenhub-suite-api',
      script: './src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { 
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://digitpenhub:digitpenhub@localhost:5432/digitpenhub',
        FRONTEND_ORIGIN: 'https://suite.digitpenhub.com'
      },
      max_memory_restart: '300M',
    },
  ],
};
