import winston from 'winston';
export interface LoggerConfig {
    level?: string;
    service: string;
    environment?: string;
}
export declare const createLogger: (config: LoggerConfig) => winston.Logger;
export type Logger = ReturnType<typeof createLogger>;
//# sourceMappingURL=index.d.ts.map