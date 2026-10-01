import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Image generation requests will fail.');
}

createApp().listen(port, () => {
  console.log(`NextUp image generator running at http://localhost:${port}`);
});
