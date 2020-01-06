module.exports = {
  apps : [{
    name: 'autoDeploy-webhook',
    script: 'npm start',

    // Options reference: https://pm2.keymetrics.io/docs/usage/application-decl$
    // args: 'one two',
    // instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '256M',
    env: {
      SECRET: 'Dj2RT2swMrei'
    }
  }]
};
