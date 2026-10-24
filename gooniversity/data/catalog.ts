// Gooniversity course catalog — types and accessors
import catalogData from './catalog.json';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  slug: string;
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tag: string;
  emoji: string;
  lessons: Lesson[];
}

export const COURSES: Course[] = catalogData as Course[];

export function getCourse(id: string): Course | null {
  return COURSES.find((c) => c.id === id) ?? null;
}
