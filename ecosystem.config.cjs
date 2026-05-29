module.exports = {
  apps: [
    {
      name: "atelierboterbloem",
      cwd: __dirname,
      script: "node_modules/tsx/dist/cli.mjs",
      args: "server/index.ts",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      time: true,
    },
  ],
};
