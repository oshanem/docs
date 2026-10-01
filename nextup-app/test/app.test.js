import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const SECRET = 'sk-secret-should-never-leak';

async function withServer(options, fn) {
  const server = createApp(options).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

function buildForm(overrides = {}) {
  const form = new FormData();
  const fields = { headline: 'Out now', story: 'A story', postType: 'new-release', size: 'portrait', ...overrides };
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) form.append(k, v);
  form.append('artistImage', new Blob([Buffer.from('img')], { type: 'image/jpeg' }), 'artist.jpg');
  return form;
}

test('POST /api/generate builds the prompt and returns the generated image', async () => {
  let received;
  const generate = async (args) => {
    received = args;
    return { b64: 'QUJD', mimeType: 'image/png' };
  };
  await withServer({ apiKey: SECRET, generate }, async (base) => {
    const res = await fetch(`${base}/api/generate`, { method: 'POST', body: buildForm() });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.image, 'data:image/png;base64,QUJD');
    assert.equal(body.size, '1024x1536');
    assert.match(received.prompt, /"Out now"/);
    assert.equal(received.apiKey, SECRET);
    assert.equal(received.image.mimeType, 'image/jpeg');
    assert.ok(!JSON.stringify(body).includes(SECRET));
  });
});

test('rejects missing fields and unsupported files', async () => {
  await withServer({ apiKey: SECRET, generate: async () => assert.fail() }, async (base) => {
    let res = await fetch(`${base}/api/generate`, { method: 'POST', body: buildForm({ headline: undefined }) });
    assert.equal(res.status, 400);

    const form = buildForm();
    form.set('artistImage', new Blob(['x'], { type: 'image/gif' }), 'a.gif');
    res = await fetch(`${base}/api/generate`, { method: 'POST', body: form });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /PNG, JPEG, or WEBP/);
  });
});

test('API key is never exposed to the browser', async () => {
  await withServer({ apiKey: SECRET }, async (base) => {
    for (const path of ['/', '/app.js', '/styles.css', '/api/config']) {
      const text = await (await fetch(base + path)).text();
      assert.ok(!text.includes(SECRET), `${path} leaked the key`);
    }
    const config = await (await fetch(`${base}/api/config`)).json();
    assert.equal(config.openaiConfigured, true);
    assert.equal((await fetch(`${base}/.env`)).status, 404);
  });
});
