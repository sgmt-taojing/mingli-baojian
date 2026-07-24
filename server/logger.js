const pino = require('pino');
const path = require('path');
const fs = require('fs');

// 确保 logs 目录存在
const logsDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';

const transport = isProd
  ? {
      target: 'pino-roll',
      options: {
        file: path.join(logsDir, 'app.log'),
        frequency: 'daily',
        mkdir: true,
        size: '100m',
        limit: { count: 30 },
      },
    }
  : {
      target: 'pino-pretty',
      options: { colorize: true },
    };

module.exports = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  transport,
});
