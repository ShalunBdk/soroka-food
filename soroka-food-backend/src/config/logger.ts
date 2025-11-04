import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d',
  maxSize: '20m',
});

// Transport for all logs
const combinedRotateTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
  maxSize: '20m',
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    errorRotateTransport,
    combinedRotateTransport,
  ],
});

// Console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      logFormat
    ),
  }));
}
