'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import PageFrame from '../../../components/PageFrame';
import { getCourse } from '../../../data/gooniversity';

function CourseInner() {
  const params = useSearchParams();
  const id = useMemo(() => params.get('cid') || '', [params]);
  const course = getCourse(id);

  return (
    <PageFrame title={course ? course.title : 'Course'} subtitle={course ? course.tagline : ''}>
      {!course ? (
        <div className="glass-card" style={{ padding: 18 }}>
          <p className="glass-card-meta" style={{ margin: 0 }}>Course not found.</p>
          <a className="btn-gold" href="/gooniversity/" style={{ display: 'inline-block', marginTop: 12 }}>Back to catalog</a>
        </div>
      ) : (
        <>
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '2rem' }}>{course.emoji}</span>
              <div>
                <h3 style={{ margin: 0 }}>{course.title}</h3>
                <div className="glass-card-meta">{course.tagline}</div>
              </div>
            </div>
            <p className="glass-card-meta" style={{ marginTop: 10 }}>{course.description}</p>
            <div className="glass-card-meta">{course.estimated} · {course.lessons.length} lessons</div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {course.lessons.map((lesson, idx) => (
              <div key={lesson.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div className="glass-card-title">Lesson {idx + 1}: {lesson.title}</div>
                    <div className="glass-card-meta">{lesson.body}</div>
                  </div>
                  <span className="kpi-delta">{lesson.duration}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <a className="btn-gold" href={`https://t.me/HeadMasterGooner_Bot/app?start_param=learn_${lesson.id}`} target="_blank" rel="noreferrer">Open Lesson</a>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-row" style={{ marginTop: 18 }}>
            <div className="glass-card" style={{ padding: 18 }}>
              <h4 className="panel-title">Course Actions</h4>
              <a className="btn-gold" href="https://t.me/HeadMasterGooner_Bot?start=gooniversity" target="_blank" rel="noreferrer">Share Course</a>
            </div>
            <div className="glass-card" style={{ padding: 18 }}>
              <h4 className="panel-title">Channel</h4>
              <div className="sp-meta">@goonerbest</div>
              <a className="btn-gold" href="https://t.me/goonerbest" target="_blank" rel="noreferrer">Open Channel</a>
            </div>
          </div>
        </>
      )}
    </PageFrame>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={<PageFrame title="Course" subtitle="Loading..."><div className="glass-card" style={{ padding: 18 }}><p className="glass-card-meta">Loading course...</p></div></PageFrame>}>
      <CourseInner />
    </Suspense>
  );
}
