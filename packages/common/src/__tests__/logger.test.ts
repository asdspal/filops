import { createLogger } from '../logger';

describe('Logger', () => {
  it('should create a logger instance', () => {
    const logger = createLogger({
      service: 'test-service',
      level: 'info',
    });

    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should log messages without throwing errors', () => {
    const logger = createLogger({
      service: 'test-service',
      level: 'debug',
    });

    expect(() => {
      logger.info('Test info message');
      logger.error('Test error message');
      logger.warn('Test warn message');
      logger.debug('Test debug message');
    }).not.toThrow();
  });
});
