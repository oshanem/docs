import { POST_TYPES } from './postTypes.js';

export const LIMITS = {
  artistName: 80,
  headline: 140,
  story: 1200,
};

// Normalizes and validates the user-supplied fields. Returns
// { value } on success or { error } with a user-facing message.
export function validateInput(body = {}) {
  const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
  const input = {
    artistName: clean(body.artistName),
    headline: clean(body.headline),
    story: clean(body.story),
    postType: clean(body.postType),
  };

  if (!input.headline) return { error: 'Headline is required.' };
  if (!input.story) return { error: 'Story information is required.' };
  if (!POST_TYPES[input.postType]) return { error: 'Select a valid NextUp post type.' };
  for (const [field, max] of Object.entries(LIMITS)) {
    if (input[field].length > max) {
      return { error: `${field} must be ${max} characters or fewer.` };
    }
  }
  return { value: input };
}

// Builds the NextUp master image prompt sent to OpenAI along with the
// uploaded artist reference image.
export function buildMasterPrompt({ artistName, headline, story, postType }) {
  const type = POST_TYPES[postType];
  if (!type) throw new Error(`Unknown post type: ${postType}`);

  const subject = artistName ? `the artist ${artistName}` : 'the artist';

  return [
    'Create a finished, publish-ready social media graphic for "NextUp", a music and culture media brand that spotlights emerging artists.',
    '',
    'REFERENCE IMAGE',
    `The attached image is a photo of ${subject}. Use it as the identity reference: preserve their face, skin tone, hairstyle, ` +
      'and overall likeness exactly. Do not change their identity, age, or body type. You may restyle lighting, background, ' +
      'and color grade, and extend or recrop the framing so they fit the composition.',
    '',
    `POST TYPE: ${type.label}`,
    type.direction,
    '',
    'STORY CONTEXT (use to inform mood, setting and visual motifs; do not print this text):',
    story,
    '',
    'TEXT TO RENDER (spell exactly as written, nothing else):',
    `1. Headline: "${headline}"`,
    `2. Badge: "${type.badge}"`,
    '3. Brand mark: "NEXTUP"',
    '',
    'LAYOUT AND BRAND RULES',
    '- Headline in a heavy, condensed, all-caps sans-serif, large and highly legible, placed in the lower third over a dark gradient so it never covers the face.',
    '- Badge as a small solid pill or tag near the top-left.',
    '- "NEXTUP" brand mark small and clean in a corner, consistent placement.',
    '- Palette: deep black and charcoal base with an electric accent color that complements the artist photo.',
    '- Cinematic lighting, sharp focus on the artist, subtle film grain, modern editorial music-media look.',
    '- Keep all text inside safe margins (at least 5% from every edge).',
    '- No extra words, logos, watermarks, captions, or misspellings beyond the text listed above.',
  ].join('\n');
}
