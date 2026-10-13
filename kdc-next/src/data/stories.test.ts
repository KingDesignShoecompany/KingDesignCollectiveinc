import { describe, it, expect } from 'vitest';
import { STORIES } from './stories';

describe('story database integrity', () => {
  it('has 8 stories with unique ids', () => {
    expect(STORIES.length).toBe(8);
    const ids = STORIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every story has text paragraphs (length >= 3)', () => {
    for (const s of STORIES) {
      expect(s.text.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every story currently has audio: null (honest simulated mode)', () => {
    for (const s of STORIES) {
      expect(s.audio).toBeNull();
    }
  });
});
