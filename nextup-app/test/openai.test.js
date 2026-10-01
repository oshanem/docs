import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImage, OpenAIImageError } from '../src/openai.js';

const image = { buffer: Buffer.from('fake'), mimeType: 'image/png', filename: 'a.png' };

test('sends prompt and reference image to the OpenAI image edit endpoint', async () => {
  let call;
  const fetchImpl = async (url, init) => {
    call = { url, init };
    return new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }), { status: 200 });
  };
  const result = await generateImage({ apiKey: 'sk-test', prompt: 'P', image, size: '1024x1536', fetchImpl });

  assert.equal(call.url, 'https://api.openai.com/v1/images/edits');
  assert.equal(call.init.headers.Authorization, 'Bearer sk-test');
  const form = call.init.body;
  assert.equal(form.get('prompt'), 'P');
  assert.equal(form.get('size'), '1024x1536');
  assert.equal(form.get('model'), 'gpt-image-1');
  assert.equal(form.get('image').type, 'image/png');
  assert.equal(result.b64, 'QUJD');
});

test('surfaces OpenAI error messages', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: { message: 'Invalid key' } }), { status: 401 });
  await assert.rejects(
    generateImage({ apiKey: 'bad', prompt: 'P', image, fetchImpl }),
    (err) => err instanceof OpenAIImageError && err.status === 401 && err.message === 'Invalid key',
  );
});

test('fails fast without an API key', async () => {
  await assert.rejects(generateImage({ apiKey: '', prompt: 'P', image }), /OPENAI_API_KEY/);
});
