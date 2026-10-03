import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listPostTypes, listSizes, SIZES } from './postTypes.js';
import { buildMasterPrompt, validateInput } from './prompt.js';
import { generateImage, OpenAIImageError } from './openai.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function createApp({ apiKey = process.env.OPENAI_API_KEY, generate = generateImage } = {}) {
  const app = express();
  app.disable('x-powered-by');

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
      cb(new UploadError('Artist image must be PNG, JPEG, or WEBP.'));
    },
  });

  app.use(express.static(PUBLIC_DIR));

  app.get('/api/config', (_req, res) => {
    res.json({
      postTypes: listPostTypes(),
      sizes: listSizes(),
      openaiConfigured: Boolean(apiKey),
    });
  });

  app.post('/api/generate', upload.single('artistImage'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Upload an artist image.' });

    const { value, error } = validateInput(req.body);
    if (error) return res.status(400).json({ error });

    const size = SIZES[req.body.size]?.value ?? SIZES.square.value;
    const prompt = buildMasterPrompt(value);

    try {
      const result = await generate({
        apiKey,
        prompt,
        size,
        image: {
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          filename: req.file.originalname || 'artist.png',
        },
      });
      res.json({
        image: `data:${result.mimeType};base64,${result.b64}`,
        prompt,
        postType: value.postType,
        size,
      });
    } catch (err) {
      if (err instanceof OpenAIImageError) {
        console.error('[generate] OpenAI error:', err.message);
        return res.status(err.status || 502).json({ error: err.message });
      }
      console.error('[generate] Unexpected error:', err);
      res.status(500).json({ error: 'Image generation failed.' });
    }
  });

  // Upload and validation errors from multer.
  app.use((err, _req, res, _next) => {
    if (err instanceof UploadError) return res.status(400).json({ error: err.message });
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Artist image must be 20 MB or smaller.' : err.message;
      return res.status(400).json({ error: message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

class UploadError extends Error {}
