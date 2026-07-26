const path = require("path");

// Project root (parent of /deploy)
const root = path.join(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "event-calendar",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: root,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "512M",
      error_file: path.join(root, "logs/err.log"),
      out_file: path.join(root, "logs/out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
