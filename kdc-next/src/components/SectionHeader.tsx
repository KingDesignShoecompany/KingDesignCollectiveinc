import React from 'react';
export default function SectionHeader({ title, subtitle, search, children }: {
  title: string; subtitle?: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h3 className="sh-title">{title}</h3>
        {subtitle && <p className="sh-sub">{subtitle}</p>}
      </div>
      {search && (
        <div className="dash-search" style={{ maxWidth: 320 }}>
          <input value={search.value} onChange={(e) => search.onChange(e.target.value)} placeholder={search.placeholder ?? 'Search...'} aria-label={search.placeholder ?? 'Search'} />
        </div>
      )}
      {children}
    </div>
  );
}
