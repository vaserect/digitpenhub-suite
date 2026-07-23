module.exports = {
  apps: [
    {
      name: 'digitpenhub-suite-web',
      script: 'npm',
      args: 'start',
      cwd: '/home/suite.digitpenhub.com/digitpenhub-suite/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        API_INTERNAL_URL: 'http://127.0.0.1:4001',
        NEXT_PUBLIC_SITE_URL: 'https://suite.digitpenhub.com'
      },
      max_memory_restart: '1G',
    },
  ],
};
