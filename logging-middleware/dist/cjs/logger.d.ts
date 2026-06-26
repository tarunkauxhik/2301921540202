import { AuthCredentials, Level, LoggerOptions, LogPackage, Stack } from "./types";
export declare function configureLogger(opts: LoggerOptions): void;
export declare function Log(stack: Stack, level: Level, pkg: LogPackage, message: string): Promise<void>;
export type { AuthCredentials, Level, LoggerOptions, LogPackage, Stack };
