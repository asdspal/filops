import { PrismaClient } from '@prisma/client';
import { createLogger } from '@filops/common';

const logger = createLogger({
  service: 'database',
  level: process.env.LOG_LEVEL || 'info',
});

// Singleton Prisma Client
let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query' as never, (e: any) => {
        logger.debug('Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });
    }

    // Handle shutdown gracefully
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
      logger.info('Prisma client disconnected');
    });
  }

  return prisma;
};

// Export Prisma types
export * from '@prisma/client';
export { prisma };

// Initialize default client
prisma = getPrismaClient();
