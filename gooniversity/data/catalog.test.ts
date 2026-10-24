import { describe, it, expect } from 'vitest';
import { COURSES, getCourse } from './catalog';

describe('gooniversity catalog', () => {
  it('has 6 courses with unique ids', () => {
    expect(COURSES.length).toBe(6);
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every course has title, tagline, emoji, and lessons', () => {
    for (const c of COURSES) {
      expect(c.title).toBeTruthy();
      expect(c.tagline).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.lessons.length).toBeGreaterThan(0);
    }
  });

  it('getCourse returns null for unknown id', () => {
    expect(getCourse('nope')).toBeNull();
  });
});
