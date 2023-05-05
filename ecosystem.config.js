module.exports = {
  apps: [
    {
      name: "Lottery Bot",
      script: "./index.js",
      instances: 1,
      max_memory_restart: "300M",

      // Env Specific Config
      env_production: {
        NODE_ENV: "production",
        instances: "max",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8080,
        watch: true,
        watch_delay: 3000,
        ignore_watch: [".git", "./node_modules", "./logs", "*.log"],
      },
    },
  ],
};
