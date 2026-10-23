import { describe, it, expect } from 'vitest';
import { COURSES, COURSE_TAGS, getCourse } from './gooniversity';

describe('gooniversity data', () => {
  it('has 6 courses with unique ids', () => {
    expect(COURSES.length).toBe(6);
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every course has title, description, lessons, and a tag', () => {
    for (const c of COURSES) {
      expect(c.title).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.lessons.length).toBeGreaterThan(0);
      expect(c.tag).toBeTruthy();
    }
  });
  it('getCourse returns null for unknown id', () => {
    expect(getCourse('nope')).toBeNull();
  });
});
