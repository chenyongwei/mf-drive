import { createApp } from './server';

const app = createApp(process.env);
const port = Number(process.env.PORT ?? 31110);

app.listen(port, '0.0.0.0', () => {
  console.log(`[drive-api] running at http://0.0.0.0:${port}`);
  console.log(`[drive-api] MODE=${process.env.MODE ?? 'mock'} MOCK_PROFILE=${process.env.MOCK_PROFILE ?? 'base'}`);
});
