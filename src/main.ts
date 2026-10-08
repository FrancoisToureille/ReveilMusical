import { createApplicationContainer } from './composition/container';
import type { Express } from 'express';

const port = Number(process.env.PORT ?? 3000);
const app = createApplicationContainer().resolve<Express>('app');
app.listen(port, () => console.log(`Réveil musical listening on ${port}`));
