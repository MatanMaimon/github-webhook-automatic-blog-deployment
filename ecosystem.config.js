module.exports = {
  apps : [{
    name: 'autoDeploy-webhook',
    script: 'npm start',
    autorestart: true,
    watch: true,
    max_memory_restart: '256M',
    env: {
      SECRET: 'Dj2RT2swMrei'
    }
  }]
};
