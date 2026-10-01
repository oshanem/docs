import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMasterPrompt, validateInput } from '../src/prompt.js';

test('validateInput requires headline, story, and a known post type', () => {
  assert.match(validateInput({ story: 's', postType: 'milestone' }).error, /Headline/);
  assert.match(validateInput({ headline: 'h', postType: 'milestone' }).error, /Story/);
  assert.match(validateInput({ headline: 'h', story: 's', postType: 'nope' }).error, /post type/);
});

test('validateInput trims and collapses whitespace', () => {
  const { value } = validateInput({ headline: '  Big   news ', story: 'x', postType: 'interview' });
  assert.equal(value.headline, 'Big news');
});

test('buildMasterPrompt includes headline, story, badge, and likeness rules', () => {
  const prompt = buildMasterPrompt({
    artistName: 'Nova',
    headline: 'Debut album out Friday',
    story: 'Recorded in Lagos over two summers.',
    postType: 'new-release',
  });
  assert.match(prompt, /"Debut album out Friday"/);
  assert.match(prompt, /Recorded in Lagos/);
  assert.match(prompt, /"NEW RELEASE"/);
  assert.match(prompt, /the artist Nova/);
  assert.match(prompt, /preserve their face/);
  assert.match(prompt, /"NEXTUP"/);
});
