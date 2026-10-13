'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { MATERIALS } from '../../data/ewaste';

export default function MaterialsPage() {
  const [selected, setSelected] = useState('gold');
  const [kg, setKg] = useState(100);
  const mat = MATERIALS.find((m) => m.key === selected) || MATERIALS[0];

  // recovery estimate: conc (g/kg) * kg * recovery
  const recoveredG = mat.conc * kg * mat.recovery;
  const recoveredOz = recoveredG * (mat.priceUnit === '/oz' ? 0.0321507 : 1);
  const value = mat.priceUnit === '/oz' ? recoveredOz * mat.price : recoveredG * mat.price;

  return (
    <PageFrame title="Materials" subtitle="Recovery calculator and rates" badge={`${MATERIALS.length} Materials`}>
      <div className="card-grid">
        {MATERIALS.map((m) => (
          <div key={m.key} onClick={() => setSelected(m.key)} style={{ cursor: 'pointer' }}>
            <GlassCard corner="KDCI" hero={m.emoji} title={m.name} meta={`${m.conc} ${m.unit} · ${(m.recovery * 100).toFixed(0)}% recovery`}
              stats={[['Price', '$' + m.price], ['Unit', m.priceUnit], ['Recovery', (m.recovery * 100).toFixed(0) + '%']]} thumbs={['Assay', 'Refine', 'Settle']} progress={m.recovery * 100} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <GlassCard corner="KDCI" title={`Estimate — ${mat.name}`} meta="Adjust feedstock to project recovery">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '.8rem', color: '#9ca3af', display: 'block', marginBottom: 6 }}>Feedstock (kg): {kg}</label>
            <input type="range" min={10} max={1000} step={10} value={kg} onChange={(e) => setKg(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#d4af37' }} />
          </div>
          <div className="card-stats" style={{ maxWidth: 420 }}>
            <div className="stat"><b>{recoveredG.toFixed(2)}g</b><span>Recovered</span></div>
            <div className="stat"><b>{recoveredOz.toFixed(3)}oz</b><span>In Ounces</span></div>
            <div className="stat"><b>${value.toFixed(2)}</b><span>Est. Value</span></div>
          </div>
        </GlassCard>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/ewaste-recycling/" className="btn-outline">← Back to E-Waste</Link>
      </div>
    </PageFrame>
  );
}
