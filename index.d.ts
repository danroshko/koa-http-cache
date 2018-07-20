interface IConfig {
  redis: any;
  prefix?: string;
  expires?: number;
}

type middleware = (ctx: any, next: () => Promise<void>) => Promise<void>

export function configure(options: IConfig): void;

export function createMiddleware(id: (ctx: any) => string): middleware;
