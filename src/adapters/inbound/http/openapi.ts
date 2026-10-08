export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Réveil musical API',
    version: '1.0.0',
    description: 'Déclenche un réveil musical selon le jour et la météo.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/health': {
      get: {
        summary: 'Vérifie que le service est disponible',
        responses: { '200': { description: 'Service disponible' } },
      },
    },
    '/wake-up': {
      post: {
        summary: 'Déclenche le réveil musical',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WakeUpCommand' },
              example: { userId: 'user-1', day: 'LUNDI', weather: 'SOLEIL' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Réveil préparé et notification simulée/envoyée',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WakeUpResult' } } },
          },
          '400': { description: 'Commande invalide' },
          '502': { description: 'Échec du traitement' },
        },
      },
    },
  },
  components: {
    schemas: {
      WakeUpCommand: {
        type: 'object',
        required: ['userId', 'day', 'weather'],
        properties: {
          userId: { type: 'string', minLength: 1 },
          day: { type: 'string', enum: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] },
          weather: { type: 'string', enum: ['SOLEIL', 'PLUIE', 'NEIGE', 'NUAGEUX'] },
        },
      },
      WakeUpResult: {
        type: 'object',
        required: ['userId', 'day', 'weather', 'song', 'channel', 'degraded'],
        properties: {
          userId: { type: 'string' },
          day: { type: 'string' },
          weather: { type: 'string' },
          song: {
            type: 'object',
            required: ['title', 'artist'],
            properties: { title: { type: 'string' }, artist: { type: 'string' }, url: { type: 'string', format: 'uri' } },
          },
          channel: { type: 'string', enum: ['email', 'sms', 'push'] },
          degraded: { type: 'boolean' },
        },
      },
    },
  },
} as const;
