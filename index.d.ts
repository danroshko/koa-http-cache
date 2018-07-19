interface IConfig {
  redis?: any;
  prefix?: string;
  expires?: number;
}

type middleware = (ctx: any, next: () => Promise<void>) => Promise<void>

export function configure(options: IConfig): void;

export function cache(namespace: string, id: string): middleware;

export function clear(namespace: string, id: string): middleware;