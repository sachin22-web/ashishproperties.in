module.exports = {
  apps: [{
    name: 'ashish-properties',
    script: 'start-prod.mjs',
    cwd: '/www/wwwroot/ashishproperties.in',
    node_args: '--enable-source-maps',
    env: {
      NODE_ENV: 'production',
      PORT: '8017',
      SPA_DIR: '/www/wwwroot/ashishproperties.in/client/dist',
      RUNNER: '0',           // agar code me koi env check ho to runner disable
      DISABLE_RUNNER: '1',
      NO_RUNNER: '1'
    }
  }]
}
