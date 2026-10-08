import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/adapters/inbound/http/app';

describe('HTTP documentation', () => {
  it('exposes OpenAPI JSON and Swagger UI', async () => {
    const app = createApp({ execute: vi.fn() });
    const openapi = await request(app).get('/openapi.json');
    expect(openapi.status).toBe(200);
    expect(openapi.body.paths['/wake-up'].post).toBeDefined();
    const docs = await request(app).get('/docs/');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('swagger-ui');
  });
});
