import pino from 'pino';

export const logger = pino(
  process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Produção: JSON puro (compatível com Render, Railway, etc.)
      }
);
