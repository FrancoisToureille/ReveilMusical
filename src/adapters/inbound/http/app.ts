import express, { Request, Response } from 'express';
import { z } from 'zod';
import { DAYS, WEATHERS } from '../../../domain/models';
import { WakeUpService } from '../../../domain/ports';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi';

const commandSchema = z.object({ userId: z.string().min(1), day: z.enum(DAYS), weather: z.enum(WEATHERS) });

export function createApp(triggerWakeUp: WakeUpService) {
  const app = express();
  app.use(express.json());
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/openapi.json', (_request, response) => response.json(openApiDocument));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.post('/wake-up', async (request: Request, response: Response) => {
    const parsed = commandSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ error: 'Invalid wake-up command' }); return; }
    try { response.json(await triggerWakeUp.execute(parsed.data)); }
    catch (error) { response.status(502).json({ error: error instanceof Error ? error.message : 'Wake-up failed' }); }
  });
  return app;
}
