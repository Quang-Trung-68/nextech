module.exports = {
  apps: [
    {
      name: "nextech-api",
      script: "./server.js",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
