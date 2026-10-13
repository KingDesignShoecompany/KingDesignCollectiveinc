'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { WP_TEMPLATES } from '../../data/innovation';

export default function WhitepapersPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <PageFrame title="White Papers" subtitle="Templates and IP disclosures" badge="15 Papers">
      <div className="card-grid">
        {WP_TEMPLATES.map((t) => (
          <div key={t.key} onClick={() => setOpen(open === t.key ? null : t.key)} style={{ cursor: 'pointer' }}>
            <GlassCard corner="KDCI" hero={t.emoji} title={t.name} meta={`${t.sections.length} sections`}
              stats={[['Sections', String(t.sections.length)], ['Type', t.key], ['Ready', '✓']]} thumbs={['Draft', 'Review', 'Publish']} progress={70} />
          </div>
        ))}
      </div>

      {open && (
        <div style={{ marginTop: 24 }}>
          <GlassCard corner="KDCI" title={`${WP_TEMPLATES.find((t) => t.key === open)?.name} — Sections`}>
            <div className="chapter-list">
              {WP_TEMPLATES.find((t) => t.key === open)?.sections.map((s, i) => (
                <div className="chapter-item" key={s}>
                  <span>{i + 1}. {s}</span>
                  <span className="ch-time">§{i + 1}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/innovation-hub/" className="btn-outline">← Back to Innovation Hub</Link>
      </div>
    </PageFrame>
  );
}
