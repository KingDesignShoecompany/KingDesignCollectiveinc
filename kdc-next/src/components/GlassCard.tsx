import React from 'react';

export default function GlassCard({
  title,
  meta,
  hero,
  corner,
  stats,
  thumbs,
  progress,
  children,
}: {
  title?: string;
  meta?: string;
  hero?: React.ReactNode;
  corner?: string;
  stats?: string[][];
  thumbs?: string[];
  progress?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-card">
      {corner && <div className="glass-card-corner">{corner}</div>}
      {hero !== undefined && <div className="glass-card-hero">{hero}</div>}
      {title && <div className="glass-card-title">{title}</div>}
      {meta && <div className="glass-card-meta">{meta}</div>}
      {stats && stats.length > 0 && (
        <div className="stat-row">
          {stats.map(([label, value]) => (
            <div className="stat" key={label}>
              <b>{value}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      {thumbs && thumbs.length > 0 && (
        <div className="thumb-row">
          {thumbs.map((t) => (
            <div className="thumb" key={t}>{t}</div>
          ))}
        </div>
      )}
      {progress !== undefined && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: progress + '%' }} />
        </div>
      )}
      {children}
    </div>
  );
}
