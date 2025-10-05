import { z } from 'zod';
export declare const BaseConfigSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    PORT: z.ZodDefault<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "staging" | "production";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    PORT: number;
}, {
    NODE_ENV?: "development" | "staging" | "production" | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    PORT?: string | undefined;
}>;
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export declare const loadConfig: <T extends z.ZodTypeAny>(schema: T) => z.infer<T>;
//# sourceMappingURL=index.d.ts.map