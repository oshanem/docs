// NextUp post types. Each entry drives both the UI dropdown and the
// type-specific section of the master prompt.
export const POST_TYPES = {
  'artist-spotlight': {
    label: 'Artist Spotlight',
    badge: 'ARTIST SPOTLIGHT',
    direction:
      'Hero portrait treatment. The artist is the dominant subject, framed confidently and centered or on the rule of thirds. ' +
      'Mood is aspirational and premium, like a magazine cover introducing a rising star.',
  },
  'new-release': {
    label: 'New Release',
    badge: 'NEW RELEASE',
    direction:
      'Music release announcement. Pair the artist with bold graphic shapes and a sense of launch energy. ' +
      'Leave room for the release title in the headline. Vibrant, high-contrast, made to stop the scroll.',
  },
  'breaking-news': {
    label: 'Breaking News',
    badge: 'BREAKING',
    direction:
      'Urgent news alert. Use a strong red accent bar, sharp diagonal elements and an editorial news aesthetic. ' +
      'Headline must be the loudest element after the artist.',
  },
  'tour-event': {
    label: 'Tour / Event',
    badge: 'LIVE',
    direction:
      'Concert or event announcement. Stage-lighting atmosphere, haze, beams of light and crowd energy behind the artist. ' +
      'Feels like a premium tour poster.',
  },
  interview: {
    label: 'Interview / Quote',
    badge: 'INTERVIEW',
    direction:
      'Editorial interview feature. Calm, intimate lighting and a clean layout. ' +
      'Treat the headline as a pull quote with large quotation marks.',
  },
  milestone: {
    label: 'Milestone / Chart',
    badge: 'MILESTONE',
    direction:
      'Achievement celebration such as a chart position, streaming record or certification. ' +
      'Gold and metallic accents, subtle confetti or light flares, triumphant mood.',
  },
};

export const SIZES = {
  square: { label: 'Square feed post (1:1)', value: '1024x1024' },
  portrait: { label: 'Portrait / story (2:3)', value: '1024x1536' },
  landscape: { label: 'Landscape (3:2)', value: '1536x1024' },
};

export function listPostTypes() {
  return Object.entries(POST_TYPES).map(([id, t]) => ({ id, label: t.label }));
}

export function listSizes() {
  return Object.entries(SIZES).map(([id, s]) => ({ id, label: s.label }));
}
