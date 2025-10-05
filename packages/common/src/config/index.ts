import { z } from 'zod';

export const BaseConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).default('3000'),
});

export type BaseConfig = z.infer<typeof BaseConfigSchema>;

export const loadConfig = <T extends z.ZodTypeAny>(schema: T): z.infer<T> => {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
};
