const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIImageError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'OpenAIImageError';
    this.status = status;
  }
}

// Sends the master prompt plus the uploaded reference image to OpenAI's
// image edit endpoint and returns { b64, mimeType, revisedPrompt }.
// Runs server-side only; the API key never leaves this process.
export async function generateImage({
  apiKey,
  prompt,
  image, // { buffer, mimeType, filename }
  size = '1024x1024',
  model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  quality = process.env.OPENAI_IMAGE_QUALITY || 'high',
  fetchImpl = fetch,
  timeoutMs = 180_000,
}) {
  if (!apiKey) throw new OpenAIImageError('OPENAI_API_KEY is not configured on the server.', 500);

  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('quality', quality);
  form.append('n', '1');
  form.append('output_format', 'png');
  // Keeps the artist's facial likeness close to the reference photo.
  form.append('input_fidelity', 'high');
  form.append('image', new Blob([image.buffer], { type: image.mimeType }), image.filename);

  let res;
  try {
    res = await fetchImpl(`${OPENAI_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    throw new OpenAIImageError(
      timedOut ? 'OpenAI image generation timed out.' : 'Could not reach the OpenAI API.',
      504,
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `OpenAI request failed with status ${res.status}.`;
    throw new OpenAIImageError(message, res.status >= 500 ? 502 : res.status);
  }

  const item = data?.data?.[0];
  if (!item?.b64_json) throw new OpenAIImageError('OpenAI returned no image data.', 502);

  return {
    b64: item.b64_json,
    mimeType: 'image/png',
    revisedPrompt: item.revised_prompt ?? null,
  };
}
