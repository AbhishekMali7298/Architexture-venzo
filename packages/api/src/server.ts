import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

const loggerConfig =
  process.env['NODE_ENV'] !== 'production'
    ? {
        level: process.env['LOG_LEVEL'] ?? 'info',
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }
    : { level: process.env['LOG_LEVEL'] ?? 'info' };

const app = Fastify({ logger: loggerConfig });

// ===== Plugins =====

await app.register(cors, {
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  credentials: true,
});

await app.register(cookie, {
  secret: process.env['COOKIE_SECRET'] ?? 'dev-cookie-secret-change-in-production',
});

// ===== Health Check =====

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// ===== Error Handler =====

app.setErrorHandler((error: FastifyError, _request, reply) => {
  const statusCode = error.statusCode ?? 500;

  app.log.error(error);

  reply.status(statusCode).send({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message:
        statusCode >= 500 && process.env['NODE_ENV'] === 'production'
          ? 'Internal server error'
          : error.message,
    },
  });
});

// ===== Not Found Handler =====

app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// ===== API Routes (to be registered) =====

// TODO: Phase 1+ routes
// app.register(authRoutes, { prefix: '/api/v1/auth' });
// app.register(projectRoutes, { prefix: '/api/v1/projects' });
// app.register(uploadRoutes, { prefix: '/api/v1/uploads' });
// app.register(exportRoutes, { prefix: '/api/v1/exports' });
// app.register(libraryRoutes, { prefix: '/api/v1/library' });
// app.register(billingRoutes, { prefix: '/api/v1/billing' });
// app.register(sharingRoutes, { prefix: '/api/v1/share' });

// ===== Start Server =====

const port = parseInt(process.env['PORT'] ?? '3001', 10);
const host = process.env['HOST'] ?? '0.0.0.0';

try {
  await app.listen({ port, host });
  app.log.info(`API server running at http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
