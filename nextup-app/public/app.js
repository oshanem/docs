// Browser code. Talks only to this app's own /api routes; it never sees
// or sends the OpenAI API key.
const $ = (id) => document.getElementById(id);

const form = $('form');
const fileInput = $('artistImage');
const dropzone = $('dropzone');
let previewUrl = null;

async function loadConfig() {
  const res = await fetch('/api/config');
  const config = await res.json();
  $('postType').innerHTML = config.postTypes
    .map((t) => `<option value="${t.id}">${t.label}</option>`)
    .join('');
  $('size').innerHTML = config.sizes
    .map((s) => `<option value="${s.id}">${s.label}</option>`)
    .join('');
  $('config-warning').hidden = config.openaiConfigured;
}

function showUploadPreview(file) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  if (!file) {
    $('uploadPreview').hidden = true;
    $('dropText').hidden = false;
    return;
  }
  previewUrl = URL.createObjectURL(file);
  $('uploadPreview').src = previewUrl;
  $('uploadPreview').hidden = false;
  $('dropText').hidden = true;
}

fileInput.addEventListener('change', () => showUploadPreview(fileInput.files[0]));
['dragenter', 'dragover'].forEach((e) => dropzone.addEventListener(e, () => dropzone.classList.add('drag')));
['dragleave', 'drop'].forEach((e) => dropzone.addEventListener(e, () => dropzone.classList.remove('drag')));

function setError(message) {
  $('error').textContent = message || '';
  $('error').hidden = !message;
}

function setLoading(loading) {
  $('generate').disabled = loading;
  $('generate').textContent = loading ? 'Generating…' : 'Generate';
  $('spinner').hidden = !loading;
  if (loading) {
    $('placeholder').hidden = true;
    $('result').hidden = true;
    $('actions').hidden = true;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError('');

  if (!fileInput.files[0]) return setError('Upload an artist image.');
  if (!$('headline').value.trim()) return setError('Enter a headline.');
  if (!$('story').value.trim()) return setError('Enter the story information.');

  setLoading(true);
  try {
    const res = await fetch('/api/generate', { method: 'POST', body: new FormData(form) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);

    $('result').src = data.image;
    $('result').hidden = false;
    $('download').href = data.image;
    $('download').download = `nextup-${data.postType}.png`;
    $('actions').hidden = false;
    $('promptText').textContent = data.prompt;
    $('promptDetails').hidden = false;
  } catch (err) {
    setError(err.message);
    $('placeholder').hidden = !$('result').hidden;
  } finally {
    setLoading(false);
  }
});

loadConfig().catch(() => setError('Could not load app configuration.'));
