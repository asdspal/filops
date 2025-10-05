import winston from 'winston';

export interface LoggerConfig {
  level?: string;
  service: string;
  environment?: string;
}

export const createLogger = (config: LoggerConfig) => {
  const { level = 'info', service, environment = 'development' } = config;

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service, environment },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
          }),
        ),
      }),
    ],
  });
};

export type Logger = ReturnType<typeof createLogger>;
