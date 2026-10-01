# NextUp post generator

A small web app for creating NextUp social posts. You upload an artist photo, enter the story information and headline, pick a NextUp post type, and click **Generate**. The server builds the NextUp master image prompt and sends it with the photo to the OpenAI image API. The generated image appears in the preview panel.

## How it works

1. The browser posts the form (photo + fields) to `POST /api/generate` on this server.
2. `src/prompt.js` validates the fields and builds the master prompt for the selected post type (`src/postTypes.js`).
3. `src/openai.js` sends the prompt and the reference photo to OpenAI's `POST /v1/images/edits` endpoint (default model `gpt-image-1`, `input_fidelity=high` to preserve the artist's likeness).
4. The server returns the image to the browser as a base64 data URL, and the preview panel shows it with a download button.

The OpenAI API key is read from `process.env.OPENAI_API_KEY` on the server only. The browser code in `public/` only calls this app's own `/api` routes and never sees the key.

## Setup

Requires Node.js 22.9 or later.

```bash
cd nextup-app
npm install
cp .env.example .env   # then set OPENAI_API_KEY in .env
npm start
```

Open http://localhost:3000.

`.env` is git-ignored. In production, set `OPENAI_API_KEY` as an environment variable on your host instead of using a file.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Required. Your OpenAI API key. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | OpenAI image model used for generation. |
| `OPENAI_IMAGE_QUALITY` | `high` | `low`, `medium`, `high`, or `auto`. |
| `PORT` | `3000` | Server port. |

## Customizing

- **Post types:** edit `src/postTypes.js`. Each type has a label, a badge rendered in the image, and art direction text.
- **Master prompt:** edit `buildMasterPrompt` in `src/prompt.js`.
- **Output formats:** edit `SIZES` in `src/postTypes.js`.

## Tests

```bash
npm test
```

The tests stub the OpenAI call, so they don't need an API key or network access.
