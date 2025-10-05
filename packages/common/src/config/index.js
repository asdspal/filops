"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = exports.BaseConfigSchema = void 0;
const zod_1 = require("zod");
exports.BaseConfigSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).default('3000'),
});
const loadConfig = (schema) => {
    const result = schema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment configuration:');
        console.error(result.error.format());
        throw new Error('Invalid environment configuration');
    }
    return result.data;
};
exports.loadConfig = loadConfig;
//# sourceMappingURL=index.js.map